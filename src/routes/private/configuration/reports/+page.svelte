<script lang="ts">
  import { enhance, type SubmitFunction } from "$app/forms";
  import { tick } from "svelte";
  import { uiMessages } from "#lib/ui/i18n.js";
  import type { PageProps } from "./$types";

  type ReportsActionData = Extract<NonNullable<PageProps["form"]>, { graphs: unknown }>;
  type DropPlacement = "before" | "after";

  let { data, form }: PageProps = $props();
  let text = $derived(uiMessages(data.language));
  let viewData = $derived(isReportsData(form) ? form : data);
  let formError = $derived(form && "error" in form ? form.error : null);
  let selectedGraph = $derived(viewData.graphs.find((graph) => graph.id === viewData.selectedGraphId) ?? null);
  let associatedSensorIds = $derived(new Set(viewData.associations.map((association) => association.sensorId)));
  let availableSensors = $derived(viewData.sensors.filter((sensor) => !associatedSensorIds.has(sensor.id)));
  let graphDialog: HTMLDialogElement | undefined = $state();
  let deleteGraphDialog: HTMLDialogElement | undefined = $state();
  let associationDialog: HTMLDialogElement | undefined = $state();
  let deleteAssociationDialog: HTMLDialogElement | undefined = $state();
  let graphNameInput: HTMLInputElement | undefined = $state();
  let associationSensorSelect: HTMLSelectElement | undefined = $state();
  let associationCoefficientInput: HTMLInputElement | undefined = $state();
  let graphOrderForm: HTMLFormElement | undefined = $state();
  let associationOrderForm: HTMLFormElement | undefined = $state();
  let graphName = $state("");
  let editingGraph: { id: number; name: string } | null = $state(null);
  let graphToDelete: { id: number; name: string } | null = $state(null);
  let editingAssociation: { sensorId: number; name: string; correctionEffect: string | null } | null = $state(null);
  let associationToDelete: { sensorId: number; name: string } | null = $state(null);
  let newAssociationSensorId = $state("");
  let associationCoefficient = $state("1");
  let draggedGraphId = $state<number | null>(null);
  let graphDropTargetId = $state<number | null>(null);
  let graphDropPlacement = $state<DropPlacement>("before");
  let graphOrderSourceId = $state(0);
  let graphOrderTargetId = $state(0);
  let graphOrderPlacement = $state<DropPlacement>("before");
  let draggedSensorId = $state<number | null>(null);
  let associationDropTargetId = $state<number | null>(null);
  let associationDropPlacement = $state<DropPlacement>("before");
  let associationOrderSourceId = $state(0);
  let associationOrderTargetId = $state(0);
  let associationOrderPlacement = $state<DropPlacement>("before");
  const closeGraphDialogOnSuccess = closeDialogOnSuccess(() => graphDialog);
  const closeDeleteGraphDialogOnSuccess = closeDialogOnSuccess(() => deleteGraphDialog);
  const closeAssociationDialogOnSuccess = closeDialogOnSuccess(() => associationDialog);
  const closeDeleteAssociationDialogOnSuccess = closeDialogOnSuccess(() => deleteAssociationDialog);

  function closeDialogOnSuccess(getDialog: () => HTMLDialogElement | undefined): SubmitFunction {
    return () =>
      async ({ result, update }) => {
        await update();
        if (result.type === "success") getDialog()?.close();
      };
  }

  function openNewGraph() {
    editingGraph = null;
    graphName = "";
    graphDialog?.showModal();
    graphNameInput?.focus();
  }

  function openEditGraph(graph: { id: number; name: string }) {
    editingGraph = graph;
    graphName = graph.name;
    graphDialog?.showModal();
    graphNameInput?.focus();
  }

  function openDeleteGraph(graph: { id: number; name: string }) {
    graphToDelete = graph;
    deleteGraphDialog?.showModal();
  }

  async function openAddAssociation() {
    editingAssociation = null;
    newAssociationSensorId = String(availableSensors[0]?.id ?? "");
    associationCoefficient = "1";
    associationDialog?.showModal();
    await tick();
    associationSensorSelect?.focus();
  }

  async function openEditAssociation(association: { sensorId: number; name: string; correctionEffect: string | null }) {
    editingAssociation = association;
    associationCoefficient = association.correctionEffect ?? "";
    associationDialog?.showModal();
    await tick();
    associationCoefficientInput?.focus();
  }

  function openDeleteAssociation(association: { sensorId: number; name: string }) {
    associationToDelete = association;
    deleteAssociationDialog?.showModal();
  }

  function getDropPlacement(event: DragEvent): DropPlacement {
    const row = event.currentTarget as HTMLTableRowElement;
    return event.clientY < row.getBoundingClientRect().top + row.offsetHeight / 2 ? "before" : "after";
  }

  function startGraphDrag(event: DragEvent, graphId: number) {
    if (viewData.databaseError) {
      event.preventDefault();
      return;
    }
    draggedGraphId = graphId;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(graphId));
    }
  }

  function allowGraphDrop(event: DragEvent, graphId: number) {
    if (draggedGraphId === null || draggedGraphId === graphId) return;
    event.preventDefault();
    graphDropTargetId = graphId;
    graphDropPlacement = getDropPlacement(event);
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  }

  async function dropGraph(event: DragEvent, targetGraphId: number) {
    const graphId = draggedGraphId;
    if (graphId === null) return;
    event.preventDefault();
    const placement = getDropPlacement(event);
    draggedGraphId = null;
    graphDropTargetId = null;
    if (graphId === targetGraphId) return;
    graphOrderSourceId = graphId;
    graphOrderTargetId = targetGraphId;
    graphOrderPlacement = placement;
    await tick();
    graphOrderForm?.requestSubmit();
  }

  function startAssociationDrag(event: DragEvent, sensorId: number) {
    if (viewData.databaseError) {
      event.preventDefault();
      return;
    }
    draggedSensorId = sensorId;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(sensorId));
    }
  }

  function allowAssociationDrop(event: DragEvent, sensorId: number) {
    if (draggedSensorId === null || draggedSensorId === sensorId) return;
    event.preventDefault();
    associationDropTargetId = sensorId;
    associationDropPlacement = getDropPlacement(event);
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  }

  async function dropAssociation(event: DragEvent, targetSensorId: number) {
    const sensorId = draggedSensorId;
    if (sensorId === null) return;
    event.preventDefault();
    const placement = getDropPlacement(event);
    draggedSensorId = null;
    associationDropTargetId = null;
    if (sensorId === targetSensorId) return;
    associationOrderSourceId = sensorId;
    associationOrderTargetId = targetSensorId;
    associationOrderPlacement = placement;
    await tick();
    associationOrderForm?.requestSubmit();
  }

  function isReportsData(value: PageProps["form"]): value is ReportsActionData {
    return value !== null && "graphs" in value;
  }
</script>

<svelte:head>
  <title>{text.dailyReportsTitle} — OkoVision</title>
  <meta name="description" content={text.dailyReportsDescription} />
</svelte:head>

<main id="contenu" class="container reports-page">
  <h2>{text.dailyReportsTitle}</h2>
  <p class="reports-description">{text.dailyReportsDescription}</p>

  {#if formError}
    <p class="reports-alert" role="alert">{formError}</p>
  {/if}
  {#if viewData.databaseError}
    <p class="reports-alert" role="alert">{text.dailyReportsLoadFailed}</p>
  {/if}

  <section class="reports-panel" aria-labelledby="graphs-title">
    <div class="reports-section-heading">
      <div>
        <h2 id="graphs-title">{text.dailyReportsGraphListTitle}</h2>
      </div>
    </div>

    <div class="reports-new-graph">
      <button
        class="reports-button reports-button-primary"
        type="button"
        onclick={openNewGraph}
        disabled={viewData.databaseError}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        {text.dailyReportsNewGraph}
      </button>
    </div>

    {#if viewData.graphs.length}
      <div class="reports-table-scroll">
        <table class="reports-table">
          <thead>
            <tr>
              <th scope="col">{text.dailyReportsReorder}</th>
              <th scope="col">{text.dailyReportsGraphName}</th>
              <th scope="col">
                <span class="visually-hidden">{text.dailyReportsEditGraph} / {text.dailyReportsDelete}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {#each viewData.graphs as graph, index (graph.id)}
              <tr
                draggable={!viewData.databaseError}
                class:reports-dragging={draggedGraphId === graph.id}
                class:reports-drop-target={graphDropTargetId === graph.id}
                class:reports-drop-after={graphDropPlacement === "after"}
                ondragstart={(event) => startGraphDrag(event, graph.id)}
                ondragover={(event) => allowGraphDrop(event, graph.id)}
                ondrop={(event) => dropGraph(event, graph.id)}
                ondragend={() => {
                  draggedGraphId = null;
                  graphDropTargetId = null;
                }}
              >
                <td>
                  <div class="reports-order-cell">
                    <span class="reports-drag-handle" aria-hidden="true">
                      <svg viewBox="0 0 16 20" fill="currentColor">
                        <circle cx="5" cy="4" r="1.2" />
                        <circle cx="11" cy="4" r="1.2" />
                        <circle cx="5" cy="10" r="1.2" />
                        <circle cx="11" cy="10" r="1.2" />
                        <circle cx="5" cy="16" r="1.2" />
                        <circle cx="11" cy="16" r="1.2" />
                      </svg>
                    </span>
                    <div class="reports-order-fallback visually-hidden">
                      <div class="reports-order-controls">
                        <form method="POST" use:enhance>
                          <input type="hidden" name="operation" value="move-graph" />
                          <input type="hidden" name="graphId" value={graph.id} />
                          <input type="hidden" name="selectedGraphId" value={viewData.selectedGraphId ?? ""} />
                          <input type="hidden" name="direction" value="up" />
                          <button
                            class="reports-icon-button"
                            type="submit"
                            aria-label="{text.dailyReportsMoveUp}: {graph.name}"
                            disabled={viewData.databaseError || index === 0}>↑</button
                          >
                        </form>
                        <form method="POST" use:enhance>
                          <input type="hidden" name="operation" value="move-graph" />
                          <input type="hidden" name="graphId" value={graph.id} />
                          <input type="hidden" name="selectedGraphId" value={viewData.selectedGraphId ?? ""} />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            class="reports-icon-button"
                            type="submit"
                            aria-label="{text.dailyReportsMoveDown}: {graph.name}"
                            disabled={viewData.databaseError || index === viewData.graphs.length - 1}>↓</button
                          >
                        </form>
                      </div>
                    </div>
                  </div>
                </td>
                <td>{graph.name}</td>
                <td class="reports-actions">
                  <div class="reports-row-actions">
                    <button
                      class="reports-action-button"
                      type="button"
                      aria-label="{text.dailyReportsEditGraph}: {graph.name}"
                      title="{text.dailyReportsEditGraph}: {graph.name}"
                      onclick={() => openEditGraph(graph)}
                      disabled={viewData.databaseError}
                    >
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                        <path
                          d="m12.8 4.2 3 3M3.5 16.5l3.2-.7L16.3 6.2a1.8 1.8 0 0 0-2.5-2.5L4.2 13.3l-.7 3.2Z"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      class="reports-action-button reports-action-button-danger"
                      type="button"
                      aria-label="{text.dailyReportsDelete}: {graph.name}"
                      title="{text.dailyReportsDelete}: {graph.name}"
                      onclick={() => openDeleteGraph(graph)}
                      disabled={viewData.databaseError}
                    >
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M4.5 6h11M8 6V4.5h4V6m2.5 0-.6 10H6.1L5.5 6m3 2.2v5.5m3-5.5v5.5"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <form method="POST" use:enhance bind:this={graphOrderForm} hidden>
        <input type="hidden" name="operation" value="reorder-graph" />
        <input type="hidden" name="graphId" value={graphOrderSourceId} />
        <input type="hidden" name="targetGraphId" value={graphOrderTargetId} />
        <input type="hidden" name="placement" value={graphOrderPlacement} />
        <input type="hidden" name="selectedGraphId" value={viewData.selectedGraphId ?? ""} />
      </form>
    {:else}
      {#if !viewData.databaseError}
        <p class="reports-empty">{text.dailyReportsNoGraphs}</p>
      {/if}
    {/if}
  </section>

  <dialog bind:this={graphDialog} class="reports-dialog" aria-labelledby="graph-dialog-title">
    <form method="POST" use:enhance={closeGraphDialogOnSuccess} class="reports-dialog-form">
      <input type="hidden" name="operation" value={editingGraph ? "rename-graph" : "create-graph"} />
      <input type="hidden" name="selectedGraphId" value={viewData.selectedGraphId ?? ""} />
      {#if editingGraph}
        <input type="hidden" name="graphId" value={editingGraph.id} />
      {/if}
      <div class="reports-dialog-heading">
        <h2 id="graph-dialog-title">
          {editingGraph ? text.dailyReportsEditGraphTitle : text.dailyReportsNewGraphTitle}
        </h2>
        <button
          class="reports-dialog-close"
          type="button"
          aria-label={text.dailyReportsCancel}
          onclick={() => graphDialog?.close()}>×</button
        >
      </div>
      <label for="graph-dialog-name">{text.dailyReportsGraphName}</label>
      <input
        id="graph-dialog-name"
        bind:this={graphNameInput}
        name="name"
        bind:value={graphName}
        maxlength="255"
        required
      />
      <div class="reports-dialog-actions">
        <button class="reports-button" type="button" onclick={() => graphDialog?.close()}>
          {text.dailyReportsCancel}
        </button>
        <button class="reports-button reports-button-primary" type="submit" disabled={viewData.databaseError}>
          {editingGraph ? text.dailyReportsRename : text.dailyReportsCreate}
        </button>
      </div>
    </form>
  </dialog>

  <dialog
    bind:this={deleteGraphDialog}
    id="delete-graph-dialog"
    class="reports-dialog"
    aria-labelledby="delete-graph-dialog-title"
    aria-describedby="delete-graph-name"
  >
    <form method="POST" use:enhance={closeDeleteGraphDialogOnSuccess} class="reports-dialog-form">
      <input type="hidden" name="operation" value="delete-graph" />
      <input type="hidden" name="graphId" value={graphToDelete?.id ?? ""} />
      <input type="hidden" name="selectedGraphId" value={viewData.selectedGraphId ?? ""} />
      <div class="reports-dialog-heading">
        <h2 id="delete-graph-dialog-title">{text.dailyReportsConfirmDeleteGraph}</h2>
        <button
          class="reports-dialog-close"
          type="button"
          aria-label={text.dailyReportsCancel}
          onclick={() => deleteGraphDialog?.close()}>×</button
        >
      </div>
      <p id="delete-graph-name" class="reports-dialog-target">{graphToDelete?.name ?? ""}</p>
      <div class="reports-dialog-actions">
        <button class="reports-button" type="button" onclick={() => deleteGraphDialog?.close()}>
          {text.dailyReportsCancel}
        </button>
        <button
          class="reports-button reports-button-danger"
          type="submit"
          disabled={viewData.databaseError || !graphToDelete}
        >
          {text.dailyReportsDelete}
        </button>
      </div>
    </form>
  </dialog>

  <section class="reports-panel" aria-labelledby="associations-title">
    <div class="reports-section-heading reports-association-heading">
      <div>
        <h2 id="associations-title">{text.dailyReportsAssociationsTitle}</h2>
      </div>
      {#if viewData.graphs.length}
        <form method="POST" use:enhance class="reports-filter">
          <input type="hidden" name="operation" value="select-graph" />
          <label for="selected-graph">{text.dailyReportsFilter}</label>
          <select
            id="selected-graph"
            name="selectedGraphId"
            value={viewData.selectedGraphId ?? ""}
            onchange={(event) => event.currentTarget.form?.requestSubmit()}
            disabled={viewData.databaseError}
          >
            {#each viewData.graphs as graph (graph.id)}
              <option value={graph.id}>{graph.name}</option>
            {/each}
          </select>
        </form>
      {/if}
    </div>

    {#if selectedGraph}
      <p class="reports-selected-graph">{selectedGraph.name}</p>
      <div class="reports-association-actions">
        <button
          class="reports-button reports-button-primary"
          type="button"
          onclick={openAddAssociation}
          disabled={viewData.databaseError || !availableSensors.length}
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          {text.dailyReportsAddAssociation}
        </button>
      </div>
      {#if !availableSensors.length && !viewData.databaseError}
        <p class="reports-empty">{text.dailyReportsNoAvailableSensors}</p>
      {/if}

      {#if viewData.associations.length}
        <div class="reports-table-scroll">
          <table class="reports-table">
            <thead>
              <tr>
                <th scope="col">{text.dailyReportsReorder}</th>
                <th scope="col">{text.dailyReportsSensor}</th>
                <th scope="col">{text.dailyReportsCoefficient}</th>
                <th scope="col">
                  <span class="visually-hidden">{text.dailyReportsEditGraph} / {text.dailyReportsDelete}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {#each viewData.associations as association, index (association.sensorId)}
                <tr
                  draggable={!viewData.databaseError}
                  class:reports-dragging={draggedSensorId === association.sensorId}
                  class:reports-drop-target={associationDropTargetId === association.sensorId}
                  class:reports-drop-after={associationDropPlacement === "after"}
                  ondragstart={(event) => startAssociationDrag(event, association.sensorId)}
                  ondragover={(event) => allowAssociationDrop(event, association.sensorId)}
                  ondrop={(event) => dropAssociation(event, association.sensorId)}
                  ondragend={() => {
                    draggedSensorId = null;
                    associationDropTargetId = null;
                  }}
                >
                  <td>
                    <div class="reports-order-cell">
                      <span class="reports-drag-handle" aria-hidden="true">
                        <svg viewBox="0 0 16 20" fill="currentColor">
                          <circle cx="5" cy="4" r="1.2" />
                          <circle cx="11" cy="4" r="1.2" />
                          <circle cx="5" cy="10" r="1.2" />
                          <circle cx="11" cy="10" r="1.2" />
                          <circle cx="5" cy="16" r="1.2" />
                          <circle cx="11" cy="16" r="1.2" />
                        </svg>
                      </span>
                      <div class="reports-order-fallback visually-hidden">
                        <div class="reports-order-controls">
                          <form method="POST" use:enhance>
                            <input type="hidden" name="operation" value="move-association" />
                            <input type="hidden" name="graphId" value={selectedGraph.id} />
                            <input type="hidden" name="sensorId" value={association.sensorId} />
                            <input type="hidden" name="selectedGraphId" value={viewData.selectedGraphId ?? ""} />
                            <input type="hidden" name="direction" value="up" />
                            <button
                              class="reports-icon-button"
                              type="submit"
                              aria-label="{text.dailyReportsMoveUp}: {association.name}"
                              disabled={viewData.databaseError || index === 0}>↑</button
                            >
                          </form>
                          <form method="POST" use:enhance>
                            <input type="hidden" name="operation" value="move-association" />
                            <input type="hidden" name="graphId" value={selectedGraph.id} />
                            <input type="hidden" name="sensorId" value={association.sensorId} />
                            <input type="hidden" name="selectedGraphId" value={viewData.selectedGraphId ?? ""} />
                            <input type="hidden" name="direction" value="down" />
                            <button
                              class="reports-icon-button"
                              type="submit"
                              aria-label="{text.dailyReportsMoveDown}: {association.name}"
                              disabled={viewData.databaseError || index === viewData.associations.length - 1}>↓</button
                            >
                          </form>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{association.name}</td>
                  <td>{association.correctionEffect ?? ""}</td>
                  <td class="reports-actions">
                    <div class="reports-row-actions">
                      <button
                        class="reports-action-button"
                        type="button"
                        aria-label="{text.dailyReportsEditGraph}: {association.name}"
                        title="{text.dailyReportsEditGraph}: {association.name}"
                        onclick={() => openEditAssociation(association)}
                        disabled={viewData.databaseError}
                      >
                        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                          <path
                            d="m12.8 4.2 3 3M3.5 16.5l3.2-.7L16.3 6.2a1.8 1.8 0 0 0-2.5-2.5L4.2 13.3l-.7 3.2Z"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        class="reports-action-button reports-action-button-danger"
                        type="button"
                        aria-label="{text.dailyReportsDelete}: {association.name}"
                        title="{text.dailyReportsDelete}: {association.name}"
                        onclick={() => openDeleteAssociation(association)}
                        disabled={viewData.databaseError}
                      >
                        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M4.5 6h11M8 6V4.5h4V6m2.5 0-.6 10H6.1L5.5 6m3 2.2v5.5m3-5.5v5.5"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <form method="POST" use:enhance bind:this={associationOrderForm} hidden>
          <input type="hidden" name="operation" value="reorder-association" />
          <input type="hidden" name="graphId" value={selectedGraph.id} />
          <input type="hidden" name="sensorId" value={associationOrderSourceId} />
          <input type="hidden" name="targetSensorId" value={associationOrderTargetId} />
          <input type="hidden" name="placement" value={associationOrderPlacement} />
          <input type="hidden" name="selectedGraphId" value={viewData.selectedGraphId ?? ""} />
        </form>
      {:else}
        <p class="reports-empty">
          {viewData.databaseError ? text.dailyReportsLoadFailed : text.dailyReportsNoAssociations}
        </p>
      {/if}
    {:else if !viewData.databaseError}
      <p class="reports-empty">{text.dailyReportsNoGraphs}</p>
    {/if}
  </section>

  <dialog
    bind:this={associationDialog}
    id="association-dialog"
    class="reports-dialog"
    aria-labelledby="association-dialog-title"
  >
    <form method="POST" use:enhance={closeAssociationDialogOnSuccess} class="reports-dialog-form">
      <input type="hidden" name="operation" value={editingAssociation ? "update-association" : "add-association"} />
      <input type="hidden" name="graphId" value={selectedGraph?.id ?? ""} />
      <input type="hidden" name="selectedGraphId" value={viewData.selectedGraphId ?? ""} />
      {#if editingAssociation}
        <input type="hidden" name="sensorId" value={editingAssociation.sensorId} />
      {/if}
      <div class="reports-dialog-heading">
        <h2 id="association-dialog-title">
          {editingAssociation ? text.dailyReportsEditAssociationTitle : text.dailyReportsAddAssociation}
        </h2>
        <button
          class="reports-dialog-close"
          type="button"
          aria-label={text.dailyReportsCancel}
          onclick={() => associationDialog?.close()}>×</button
        >
      </div>
      {#if editingAssociation}
        <p class="reports-dialog-target">{editingAssociation.name}</p>
      {:else}
        <label for="association-sensor">{text.dailyReportsSensor}</label>
        <select
          id="association-sensor"
          bind:this={associationSensorSelect}
          bind:value={newAssociationSensorId}
          name="sensorId"
          required
          disabled={viewData.databaseError || !availableSensors.length}
        >
          {#each availableSensors as sensor (sensor.id)}
            <option value={sensor.id}>{sensor.name}</option>
          {/each}
        </select>
      {/if}
      <label for="association-coefficient">{text.dailyReportsCoefficient}</label>
      <input
        id="association-coefficient"
        bind:this={associationCoefficientInput}
        bind:value={associationCoefficient}
        name="coefficient"
        type="text"
        inputmode="decimal"
        required
        disabled={viewData.databaseError}
      />
      <div class="reports-dialog-actions">
        <button class="reports-button" type="button" onclick={() => associationDialog?.close()}>
          {text.dailyReportsCancel}
        </button>
        <button
          class="reports-button reports-button-primary"
          type="submit"
          disabled={viewData.databaseError || !selectedGraph || (!editingAssociation && !availableSensors.length)}
        >
          {editingAssociation ? text.dailyReportsRename : text.dailyReportsAddAssociation}
        </button>
      </div>
    </form>
  </dialog>

  <dialog
    bind:this={deleteAssociationDialog}
    id="delete-association-dialog"
    class="reports-dialog"
    aria-labelledby="delete-association-dialog-title"
    aria-describedby="delete-association-name"
  >
    <form method="POST" use:enhance={closeDeleteAssociationDialogOnSuccess} class="reports-dialog-form">
      <input type="hidden" name="operation" value="delete-association" />
      <input type="hidden" name="graphId" value={selectedGraph?.id ?? ""} />
      <input type="hidden" name="sensorId" value={associationToDelete?.sensorId ?? ""} />
      <input type="hidden" name="selectedGraphId" value={viewData.selectedGraphId ?? ""} />
      <div class="reports-dialog-heading">
        <h2 id="delete-association-dialog-title">{text.dailyReportsConfirmDeleteAssociation}</h2>
        <button
          class="reports-dialog-close"
          type="button"
          aria-label={text.dailyReportsCancel}
          onclick={() => deleteAssociationDialog?.close()}>×</button
        >
      </div>
      <p id="delete-association-name" class="reports-dialog-target">{associationToDelete?.name ?? ""}</p>
      <div class="reports-dialog-actions">
        <button class="reports-button" type="button" onclick={() => deleteAssociationDialog?.close()}>
          {text.dailyReportsCancel}
        </button>
        <button
          class="reports-button reports-button-danger"
          type="submit"
          disabled={viewData.databaseError || !selectedGraph || !associationToDelete}
        >
          {text.dailyReportsDelete}
        </button>
      </div>
    </form>
  </dialog>
</main>
