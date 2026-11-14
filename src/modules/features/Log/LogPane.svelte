<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { logMessages } from "@vrtmrz/livesync-commonlib/compat/mock_and_interop/stores";
    import { reactive, type ReactiveInstance } from "octagonal-wheels/dataobject/reactive";
    import { Logger } from "@vrtmrz/livesync-commonlib/compat/common/logger";
    import { $msg as msg, currentLang as lang } from "@/common/translation";
    import { toLogRows } from "./logLine";
    import { compatGlobal } from "@vrtmrz/livesync-commonlib/compat/common/coreEnvFunctions";

    let unsubscribe: () => void;
    let messages = $state([] as string[]);
    let rows = $derived(toLogRows(messages));
    let wrapRight = $state(true);
    let autoScroll = $state(true);
    let suspended = $state(false);

    type Props = {
        close: () => void;
    };
    let { close }: Props = $props();
    // export let close: () => void;
    function updateLog(logs: ReactiveInstance<string[]>) {
        const e = logs.value;
        if (!suspended) {
            messages = [...e];
            compatGlobal.setTimeout(() => {
                if (autoScroll && scroll) scroll.scrollTop = scroll.scrollHeight;
            }, 10);
        }
    }
    onMount(async () => {
        const _logMessages = reactive(() => logMessages.value);
        _logMessages.onChanged(updateLog);
        Logger(msg("logPane.logWindowOpened", {}, lang));
        unsubscribe = () => _logMessages.offChanged(updateLog);
    });
    onDestroy(() => {
        if (unsubscribe) unsubscribe();
    });
    let scroll: HTMLDivElement;
    function closeDialogue() {
        close();
    }
</script>

<div class="logpane">
    <!-- <h1>{msg("logPane.title", {}, lang)}</h1> -->
    <div class="control">
        <div class="row">
            <label>
                <input type="checkbox" bind:checked={wrapRight} />
                <span>{msg("logPane.wrap", {}, lang)}</span>
            </label>
            <label>
                <input type="checkbox" bind:checked={autoScroll} />
                <span>{msg("logPane.autoScroll", {}, lang)}</span>
            </label>
            <label>
                <input type="checkbox" bind:checked={suspended} />
                <span>{msg("logPane.pause", {}, lang)}</span>
            </label>
            <span class="spacer"></span>
            <button onclick={() => closeDialogue()}>{msg("Close", {}, lang)}</button>
        </div>
    </div>
    <div class="log" bind:this={scroll}>
        {#each rows as row}
            {#if row.kind === "date"}
                <div class="date">{row.date}</div>
            {:else}
                <pre class:wrap-right={wrapRight}><span class="time">{row.time}</span> {row.message}</pre>
            {/if}
        {/each}
    </div>
</div>

<style>
    * {
        box-sizing: border-box;
    }
    .logpane {
        display: flex;
        height: 100%;
        flex-direction: column;
    }
    .log {
        overflow-y: scroll;
        user-select: text;
        -webkit-user-select: text;
        padding-bottom: 2em;
        font-size: var(--font-smallest);
        line-height: 1.35;
    }
    /* The floating navigation bar on mobile sits over the bottom of the view. */
    :global(.is-mobile) .log {
        font-size: 11px;
        padding-bottom: calc(2.5em + env(safe-area-inset-bottom, 0px));
    }
    .log > pre {
        margin: 0;
        padding: 0;
        font-size: inherit;
        line-height: inherit;
        background: none;
    }
    .log > pre.wrap-right {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        max-width: 100%;
        /* Wrapped lines hang under the message, not the time. */
        padding-left: 1.5em;
        text-indent: -1.5em;
    }
    .time {
        color: var(--text-faint);
    }
    .date {
        margin: 0.6em 0 0.2em;
        font-family: var(--font-monospace);
        font-weight: var(--font-semibold);
        color: var(--text-muted);
        border-bottom: 1px solid var(--background-modifier-border);
    }
    .date:first-child {
        margin-top: 0;
    }
    .row {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
    }
    .row > label {
        display: flex;
        align-items: center;
        min-width: 5em;
        margin-right: 1em;
    }
</style>
