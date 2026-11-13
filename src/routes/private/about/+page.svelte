<script lang="ts">
  import { uiMessages } from "#lib/i18n.js";
  import type { PageProps } from "./$types";

  const pageSize = 10;
  let { data }: PageProps = $props();
  let text = $derived(uiMessages(data.language));
  let currentPage = $state(1);
  let pageCount = $derived(Math.max(1, Math.ceil(data.releases.length / pageSize)));
  let visiblePage = $derived(Math.min(currentPage, pageCount));
  let visibleReleases = $derived(data.releases.slice((visiblePage - 1) * pageSize, visiblePage * pageSize));
</script>

<svelte:head>
  <title>{text.about} — OkoVision</title>
  <meta name="description" content={text.aboutDescription} />
</svelte:head>

<main id="contenu" class="container about-page">
  <!-- <p class="eyebrow">{text.aboutEyebrow}</p> -->
  <div class="about-heading">
    <div>
      <h1>{text.about}</h1>
      <p class="about-intro">{text.aboutIntroduction}</p>
    </div>
    <p class="about-version"><span>{text.aboutVersion}</span><strong>{data.applicationVersion}</strong></p>
  </div>

  <section class="about-section" aria-labelledby="updates-title">
    <div class="about-section-heading">
      <div>
        <h2 id="updates-title">{text.aboutUpdatesTitle}</h2>
        <p>{text.aboutUpdatesDescription}</p>
      </div>
      {#if !data.updateFeedError}
        <span class="about-count">{data.releases.length}</span>
      {/if}
    </div>

    {#if data.updateFeedError}
      <p class="about-update-error" role="alert">{text.aboutUpdatesUnavailable}</p>
    {:else}
      {#if data.releases.length === 0}
        <p class="about-empty">{text.aboutUpdatesEmpty}</p>
      {:else}
        <ol class="about-release-list">
          {#each visibleReleases as release (release.version)}
            <li>
              <article class="about-release">
                <header>
                  <h3>{text.aboutRelease} {release.version}</h3>
                  {#if release.date}
                    <span>{release.date}</span>
                  {:else}
                    <span>{text.aboutDateUnavailable}</span>
                  {/if}
                </header>
                <p>{release.changelog || text.aboutChangelogUnavailable}</p>
              </article>
            </li>
          {/each}
        </ol>
        {#if pageCount > 1}
          <nav class="about-pagination" aria-label={text.aboutPagination}>
            <button type="button" disabled={visiblePage === 1} onclick={() => currentPage = visiblePage - 1}>{text.aboutPreviousPage}</button>
            <span aria-live="polite">{text.aboutPage} {visiblePage} {text.aboutPageOf} {pageCount}</span>
            <button type="button" disabled={visiblePage === pageCount} onclick={() => currentPage = visiblePage + 1}>{text.aboutNextPage}</button>
          </nav>
        {/if}
      {/if}
    {/if}
  </section>
</main>
