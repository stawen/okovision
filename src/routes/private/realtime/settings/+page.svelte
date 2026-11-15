<script lang="ts">
  import { resolve } from "$app/paths";
  import { navigationPages } from "#lib/ui/navigation.js";
  import { numberLocale, uiMessages } from "#lib/ui/i18n.js";
  import { realtimeSections, editableRealtimeIndicators, legacySensorId, type RealtimeReading, type RealtimeIndicatorDefinition } from "#lib/indicators/realtime.js";
  import { getContext, onMount } from "svelte";
  import { BoilerDraft, boilerDraftContext } from "#lib/boiler-draft.svelte.js";
  import { boilerConfigurationText } from "#lib/ui/boiler-configurations.js";
  import { stepBoilerValue } from "#lib/boiler-configurations.js";
  import { configurationRequest, ConfigurationRequestError, isObject } from "#lib/boiler-configuration-api.js";
  import type { EditableBoilerSensor } from "#lib/server/boiler.js";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  let readings = $derived(data.indicators?.readings ?? {});
  let updatedAt = $derived(data.indicators?.updatedAt ?? null);
  let realtimeError = $derived(data.realtimeError);
  let text = $derived(uiMessages(data.language));
  let tabs = $derived(navigationPages(data.language).filter((page) => page.group === "realtime"));
  const draft = getContext<BoilerDraft | undefined>(boilerDraftContext) ?? new BoilerDraft();
  let configText = $derived(boilerConfigurationText(data.language));
  let dialog: HTMLDialogElement | undefined = $state();
  let editing: RealtimeIndicatorDefinition | null = $state(null);
  let sensor: EditableBoilerSensor | null = $state(null);
  let value = $state("");
  let editError = $state("");
  let loading = $state(false);

  onMount(() => draft.initialize(data.indicators));

  function canEdit(indicator: RealtimeIndicatorDefinition): boolean {
    return editableRealtimeIndicators.includes(indicator);
  }

  function displayValue(indicator: RealtimeIndicatorDefinition): string {
    const staged = draft.values[legacySensorId(indicator)];
    if (canEdit(indicator) && staged !== undefined) {
      const [number, unit] = staged.split(" ");
      const formatted = Number(number).toLocaleString(numberLocale(data.language), { maximumFractionDigits: 20 });
      return unit ? `${formatted} ${unit}` : formatted;
    }
    return formatReading(readings[indicator.id]);
  }

  async function edit(indicator: RealtimeIndicatorDefinition) {
    editing = indicator;
    sensor = null;
    editError = "";
    loading = true;
    draft.busy = true;
    dialog?.showModal();
    try {
      const result = await configurationRequest({ operation: "sensor", id: legacySensorId(indicator) });
      if (!isObject(result.sensor) || typeof result.sensor.value !== "number" || typeof result.sensor.unit !== "string"
        || typeof result.sensor.min !== "number" || typeof result.sensor.max !== "number" || typeof result.sensor.divisor !== "number") {
        throw new Error("Invalid sensor response");
      }
      sensor = { value: result.sensor.value, unit: result.sensor.unit, min: result.sensor.min,
        max: result.sensor.max, divisor: result.sensor.divisor };
      value = draft.values[legacySensorId(indicator)]?.split(" ")[0] ?? String(sensor.value);
    } catch {
      editError = configText.sensorError;
    } finally {
      loading = false;
      draft.busy = false;
    }
  }

  async function confirmEdit() {
    if (!editing || !sensor || value.trim() === "" || loading) return;
    const numeric = Number(value.replace(",", "."));
    const raw = numeric * sensor.divisor;
    if (!Number.isFinite(numeric) || numeric < sensor.min || numeric > sensor.max
      || Math.abs(raw - Math.round(raw)) > 1e-8) {
      editError = configText.invalid;
      return;
    }
    loading = true;
    draft.busy = true;
    try {
      const result = await configurationRequest({ operation: "validate", id: legacySensorId(editing), value: numeric });
      if (result.valid !== true) throw new Error("Invalid validation response");
      draft.set(legacySensorId(editing), `${numeric}${sensor.unit ? ` ${sensor.unit}` : ""}`);
      dialog?.close();
    } catch (cause) {
      editError = cause instanceof ConfigurationRequestError && cause.code === "invalid" ? configText.invalid : configText.sensorError;
    } finally {
      loading = false;
      draft.busy = false;
    }
  }

  function stepValue(direction: 1 | -1) {
    if (!sensor || loading) return;
    const next = stepBoilerValue(value, sensor, direction);
    if (next === null) {
      editError = configText.invalid;
      return;
    }
    value = next;
    editError = "";
  }

  function errorMessage(code: string): string {
    switch (code) {
      case "configuration":
        return text.realtimeConfigError;
      case "credentials":
        return text.realtimeCredentialsError;
      case "database":
        return text.realtimeDatabaseError;
      case "connection":
        return text.realtimeConnectionError;
      case "response":
        return text.realtimeResponseError;
      default:
        return text.realtimeUnavailableError;
    }
  }

  function formatReading(reading: RealtimeReading | undefined): string {
    if (!reading || reading.value === null) return text.realtimeNoReading;
    const value =
      typeof reading.value === "number"
        ? reading.value.toLocaleString(numberLocale(data.language), { maximumFractionDigits: 2 })
        : reading.value;
    return reading.unit ? `${value} ${reading.unit}` : value;
  }
</script>

<svelte:head>
  <title>{text.realtimeSettingsTitle} — OkoVision</title>
  <meta name="description" content={text.realtimeSettingsDescription} />
</svelte:head>

<main id="contenu" class="container realtime-page">
  <nav class="page-tabs" aria-label={text.realtime}>
    {#each tabs as tab (tab.path)}
      <a href={resolve(tab.path)} class:pending-tab={draft.dirty && tab.path === "/private/realtime/configurations"} aria-current={tab.path === "/private/realtime/settings" ? "page" : undefined}>
        {tab.title}
      </a>
    {/each}
  </nav>
  {#if draft.dirty}
    <p class="configuration-pending" role="status">{configText.pending}</p>
  {/if}
  {#if draft.partialLoaded}
    <p class="configuration-pending" role="status">{configText.loadedPartial}</p>
  {/if}

  <section
    class="realtime-status"
    class:realtime-status-error={realtimeError !== null}
    aria-live="polite"
    aria-atomic="true"
  >
    <span class="realtime-status-dot" aria-hidden="true"></span>
    <div>
      <p class="realtime-status-title">
        {#if realtimeError}
          {errorMessage(realtimeError)}
        {:else if updatedAt}
          {text.realtimeStatusConnected}
        {:else}
          {text.realtimeStatusWaiting}
        {/if}
      </p>
      {#if updatedAt}
        <p class="realtime-updated">
          {text.realtimeLastUpdate} :
          <time datetime={new Date(updatedAt).toISOString()}>
            {new Date(updatedAt).toLocaleTimeString(numberLocale(data.language), {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </time>
        </p>
      {/if}
    </div>
  </section>

  <div class="realtime-sections">
    {#each realtimeSections as section, sectionIndex (section.titleKey)}
      <section class="realtime-section" aria-labelledby={`realtime-section-${sectionIndex}`}>
        <header class="realtime-section-heading">
          <h2 id={`realtime-section-${sectionIndex}`}>{text[section.titleKey]}</h2>
        </header>
        <div class="realtime-reading-grid">
          {#each section.indicators as indicator (indicator.id)}
            {@const reading = readings[indicator.id]}
            {@const tooltip = indicator.tooltipKey ? text[indicator.tooltipKey].trim() : ""}
            <article class="realtime-reading" class:reading-modified={legacySensorId(indicator) in draft.changes}>
              <div class="realtime-reading-value">
                {#if tooltip}
                  <span class="realtime-info-wrap">
                    <button
                      class="realtime-info"
                      type="button"
                      aria-label={`${text.realtimeInformation} : ${text[indicator.labelKey]}`}
                      aria-describedby={`realtime-tooltip-${indicator.id}`}><span aria-hidden="true">i</span></button
                    >
                    <span class="realtime-tooltip" id={`realtime-tooltip-${indicator.id}`} role="tooltip"
                      >{tooltip}</span
                    >
                  </span>
                {/if}
                <span
                  class="realtime-value"
                  aria-label={(reading?.value === null || reading === undefined) && (!canEdit(indicator) || draft.values[legacySensorId(indicator)] === undefined) ? text.realtimeNoReading : undefined}
                  >{displayValue(indicator)}</span
                >
                {#if canEdit(indicator)}
                  <button class="edit-reading" type="button" aria-label={`${configText.edit} : ${text[indicator.labelKey]}`}
                    onclick={() => edit(indicator)} disabled={!draft.initialized || !(legacySensorId(indicator) in draft.baseline) || !reading || reading.value === null}>✎</button>
                {/if}
              </div>
              <h3 class="realtime-reading-label">{text[indicator.labelKey]}</h3>
              {#if legacySensorId(indicator) in draft.changes}<span class="modified-label">{configText.modified}</span>{/if}
            </article>
          {/each}
        </div>
      </section>
    {/each}
  </div>
  <dialog bind:this={dialog} class="reports-dialog configuration-dialog" aria-labelledby="edit-indicator-title" oncancel={(event) => { if (loading) event.preventDefault(); }}>
    <header class="edit-header">
      <h2 id="edit-indicator-title">{editing ? text[editing.labelKey] : configText.edit}</h2>
      <button class="reports-dialog-close" type="button" aria-label={configText.close} disabled={loading} onclick={() => dialog?.close()}>×</button>
    </header>
    <form onsubmit={(event) => { event.preventDefault(); void confirmEdit(); }}>
      <div class="edit-content">
        {#if loading}<p class="edit-status" role="status">{configText.loading}</p>{/if}
        {#if sensor}
          <div id="edit-indicator-limits" class="edit-limits">
            <div><span>{configText.min}</span><strong>{sensor.min.toLocaleString(numberLocale(data.language))} {sensor.unit}</strong></div>
            <div><span>{configText.max}</span><strong>{sensor.max.toLocaleString(numberLocale(data.language))} {sensor.unit}</strong></div>
          </div>
          <label for="boiler-value">{configText.value}{sensor.unit ? ` (${sensor.unit})` : ""}</label>
          <div class="edit-value-control">
            <input id="boiler-value" type="text" inputmode="decimal" bind:value required disabled={loading}
              aria-invalid={editError ? "true" : undefined}
              aria-describedby={editError ? "edit-indicator-limits edit-indicator-error" : "edit-indicator-limits"}
              oninput={() => { editError = ""; }}
              onkeydown={(event) => {
                if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                  event.preventDefault();
                  stepValue(event.key === "ArrowUp" ? 1 : -1);
                }
              }} />
            <div class="edit-steppers">
              <button type="button" aria-label={configText.increase} disabled={loading} onclick={() => stepValue(1)}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 10 4-4 4 4" /></svg>
              </button>
              <button type="button" aria-label={configText.decrease} disabled={loading} onclick={() => stepValue(-1)}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
              </button>
            </div>
          </div>
        {/if}
        {#if editError}<p id="edit-indicator-error" class="edit-error" role="alert">{editError}</p>{/if}
      </div>
      <footer class="edit-actions">
        <button class="reports-button" type="button" disabled={loading} onclick={() => dialog?.close()}>{configText.cancel}</button>
        {#if sensor}<button class="reports-button reports-button-primary" type="submit" disabled={loading}>{configText.validate}</button>{/if}
      </footer>
    </form>
  </dialog>
</main>

<style>
  .configuration-pending { padding: .65rem; border: 1px solid #d89c22; background: #fff5d6; color: #604000; }
  .pending-tab { animation: pending 1.5s ease-in-out infinite; }
  @keyframes pending { 50% { background-color: #ffe4a0; } }
  @media (prefers-reduced-motion: reduce) { .pending-tab { animation: none; background: #ffe4a0; } }
  .reading-modified { outline: 2px solid #d89c22; }
  .modified-label { display: block; color: #725000; font-size: .8rem; }
  .edit-reading { position: absolute; top: .7rem; right: .7rem; border: 0; background: transparent; color: white; cursor: pointer; font-size: 1rem; }
  .edit-reading:disabled { opacity: .5; cursor: not-allowed; }
  .edit-reading:focus-visible { outline: 2px solid white; outline-offset: 3px; }
  .configuration-dialog { width: min(22rem, calc(100vw - 2rem)); max-height: calc(100dvh - 2rem); padding: 0; overflow-y: auto; }
  .edit-header { display: flex; justify-content: space-between; align-items: center; gap: .75rem; padding: .7rem 1rem; border-bottom: 1px solid #e4eaf1; }
  .edit-header h2 { color: #253247; font-size: 1rem; line-height: 1.3; }
  .edit-header button { flex-shrink: 0; cursor: pointer; }
  .edit-content { display: grid; gap: .4rem; padding: .8rem 1rem; }
  .edit-limits { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: .15rem; border: 1px solid #e1e8ef; border-radius: 6px; background: #f5f8fb; }
  .edit-limits div { display: flex; flex-wrap: wrap; align-items: baseline; gap: .15rem .35rem; min-width: 0; padding: .4rem .6rem; }
  .edit-limits div + div { border-left: 1px solid #e1e8ef; }
  .edit-limits span { color: #64758a; font-size: .75rem; }
  .edit-limits strong { color: #253e59; font-size: .8rem; overflow-wrap: anywhere; }
  .edit-content label { color: #42566d; font-size: .82rem; font-weight: 650; }
  .edit-value-control { display: flex; width: 100%; min-width: 0; border: 1px solid #b9c9d9; border-radius: 6px; overflow: hidden; background: #fff; }
  .edit-value-control:focus-within { outline: 3px solid #78b9f1; outline-offset: 2px; }
  .edit-value-control input { flex: 1; width: 0; min-width: 0; padding: .35rem .65rem; border: 0; background: transparent; color: #253247; font: inherit; font-size: .95rem; font-weight: 650; }
  .edit-value-control input:focus-visible { outline: none; }
  .edit-steppers { display: grid; grid-template-rows: 1fr 1fr; width: 2.4rem; border-left: 1px solid #d5dfe8; }
  .edit-steppers button { display: grid; place-items: center; min-height: 1.25rem; padding: 0; border: 0; background: #f8fafc; color: #3d5974; cursor: pointer; }
  .edit-steppers button + button { border-top: 1px solid #d5dfe8; }
  .edit-steppers button:hover:not(:disabled) { background: #e7f0f9; color: #174e82; }
  .edit-steppers button:focus-visible { outline-offset: -3px; }
  .edit-steppers svg { width: 1rem; height: 1rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .edit-status { color: #64758a; font-size: .8rem; line-height: 1.4; }
  .edit-error { color: #8e3535; font-size: .82rem; }
  .edit-actions { display: flex; justify-content: flex-end; gap: .55rem; padding: .65rem 1rem; border-top: 1px solid #e4eaf1; background: #fbfcfe; }
  .edit-actions button { font-family: inherit; cursor: pointer; }
  .configuration-dialog button:disabled { opacity: .55; cursor: not-allowed; }
</style>
