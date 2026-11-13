<script lang="ts">
  import { uiMessages } from "#lib/i18n.js";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  let text = $derived(uiMessages(data.language));
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
      <p class="about-update-note">{text.aboutUpdatesNote}</p>
      {#if data.releases.length === 0}
        <p class="about-empty">{text.aboutUpdatesEmpty}</p>
      {:else}
        <ol class="about-release-list">
          {#each data.releases as release (release.version)}
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
      {/if}
    {/if}
  </section>
</main>
