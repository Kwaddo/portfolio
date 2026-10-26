---
title: LPS
summary: A Linux desktop app that monitors CPU, RAM, swap, fan and network.
status: archived
lastWorked: 2025-02-22
stack: [C++, Dear ImGui, SDL2]
journey: false
order: 6
cover: ../../assets/media/lps/cover.png
coverAlt: The LPS "Memory and Processes" panel in a dark Dear ImGui theme, with bars for physical memory, virtual memory and disk usage above a filterable table of process IDs, names, states, CPU and memory usage.
gallery:
  - src: ../../assets/media/lps/01-cpu-graph.png
    alt: The LPS CPU tab showing a line graph of CPU usage on a dark blue plot, with an Animation checkbox and FPS and Y Scale sliders below it.
    caption: Live CPU usage graph with FPS and scale controls.
---
LPS (Linux Process System) is a desktop application written in C++ that monitors system resources and performance: CPU, RAM, swap, fan and network. Its interface is built with Dear ImGui, and it targets Ubuntu and other Linux systems.
