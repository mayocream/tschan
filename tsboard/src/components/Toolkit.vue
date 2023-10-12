<script setup lang="ts">
import { useTool } from '../state'

const toolState = useTool()

const selectTool = (tool: string) => {
  toolState.tool.value = tool
}
</script>

<template>
  <div class="flex flex-col w-[2rem] text-neutral-focus my-[2rem] text-center select-none">
    <div
      class="mx-auto cursor-default hover:bg-gray-300 data-[active=true]:bg-gray-300"
      :data-active="toolState.tool.value == 'selector'"
      @click="selectTool('selector')"
    >
      <span class="material-symbols-outlined">arrow_selector_tool</span>
    </div>
    <div
      class="mx-auto mt-[1rem] cursor-default hover:bg-gray-300 data-[active=true]:bg-gray-300"
      :data-active="toolState.tool.value == 'textbox'"
      @click="selectTool('textbox')"
    >
      <span class="material-symbols-outlined">rectangle</span>
    </div>
  </div>
</template>
