<script lang="ts">
  import { resolve } from "$app/paths";
  import { navigationPages } from "#lib/navigation.js";
  import { numberLocale, uiMessages } from "#lib/i18n.js";
  import { realtimeSections, type RealtimeReading } from "#lib/realtime-indicators.js";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  let readings = $derived(data.indicators?.readings ?? {});
  let updatedAt = $derived(data.indicators?.updatedAt ?? null);
  let realtimeError = $derived(data.realtimeError);
  let text = $derived(uiMessages(data.language));
  let tabs = $derived(navigationPages(data.language).filter((page) => page.group === "realtime"));

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
      <a href={resolve(tab.path)} aria-current={tab.path === "/private/realtime/settings" ? "page" : undefined}>
        {tab.title}
      </a>
    {/each}
  </nav>

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
            <article class="realtime-reading">
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
                  aria-label={reading?.value === null || reading === undefined ? text.realtimeNoReading : undefined}
                  >{formatReading(reading)}</span
                >
              </div>
              <h3 class="realtime-reading-label">{text[indicator.labelKey]}</h3>
            </article>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</main>
