---
title: Dopher Alpha
summary: A basic 3D rendering engine in Go that uses the raycasting techniques of Doom and Wolfenstein 3D.
status: prototype
lastWorked: 2025-08-09
stack: [Go, SDL2]
playable: none
journey: false
order: 5
cover: ../../assets/media/dopher-alpha/cover.png
coverAlt: First-person view down a dark corridor in the Dopher raycasting engine, with a red and white checkered wall on the right, grey checkered walls ahead, and a brown gradient floor
gallery:
  - src: ../../assets/media/dopher-alpha/01-corridor.png
    alt: Long corridor in perspective with grey checkered walls converging toward a dark vanishing point
    caption: Raycast corridor with distance shading
  - src: ../../assets/media/dopher-alpha/02-red-white-wall.png
    alt: Grey and white checkered wall running along the right side of a dark hallway with a brown floor gradient
    caption: Textured walls and floor gradient
  - src: ../../assets/media/dopher-alpha/03-logo.png
    alt: The word DOPHER in blue gradient pixel-art lettering on a black background
    caption: Dopher logo
---
Dopher Alpha is a basic 3D rendering engine written in Go. It uses the raycasting techniques of classic games like Doom and Wolfenstein 3D, and renders with SDL2.

It includes a minimap and a full-map view, and it is the first step of a larger game engine.
