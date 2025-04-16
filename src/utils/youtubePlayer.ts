// src/utils/youtubePlayer.ts

const LOFI_VIDEOS = [
  "n61ULEU7CO0", // Lofi Girl
  "lTRiuFIWV54", // Chill lofi focus beats
  "wAPCSnAhhC8",
];

// Add reference to the YouTube types
/// <reference types="@types/youtube" />

let player: YT.Player | null = null;
let playerReady = false;

// Extend the global Window interface to include the YouTube API ready function
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: typeof YT; // Add YT namespace to window type
  }
}

const youtubeApiReady = new Promise<void>(resolve => {
  // Check if the API script is already added
  if (document.getElementById("youtube-iframe-api")) {
    // If the API is already loaded (e.g., via index.html), wait for onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube IFrame API ready (already loaded).");
      resolve();
    };
    // If window.YT is already available, resolve immediately
    // Check YT and YT.Player exist before resolving
    if (window.YT && window.YT.Player) {
      console.log("YouTube IFrame API ready (window.YT exists).");
      resolve();
    }
  } else {
    // Load the IFrame Player API code asynchronously.
    const tag = document.createElement("script");
    tag.id = "youtube-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube IFrame API ready (dynamically loaded).");
      resolve();
    };
  }
});

function createPlayer(): Promise<YT.Player> {
  return new Promise(resolve => {
    if (player && playerReady) {
      resolve(player);
      return;
    }

    // Ensure the container exists
    let playerContainer = document.getElementById("youtube-player-container");
    if (!playerContainer) {
      playerContainer = document.createElement("div");
      playerContainer.id = "youtube-player-container";
      // Hide the player visually but keep it accessible
      playerContainer.style.position = "absolute";
      playerContainer.style.top = "-9999px";
      playerContainer.style.left = "-9999px";
      playerContainer.style.width = "1px";
      playerContainer.style.height = "1px";
      document.body.appendChild(playerContainer);
    }

    youtubeApiReady
      .then(() => {
        console.log("Creating new YouTube player instance.");
        player = new YT.Player("youtube-player-container", {
          height: "1", // Minimal size
          width: "1",
          playerVars: {
            playsinline: 1, // Important for mobile playback
          },
          events: {
            onReady: () => {
              console.log("YouTube Player Ready.");
              playerReady = true;
              resolve(player!);
            },
            // Use the correct event type from @types/youtube
            onError: (event: YT.OnErrorEvent) => {
              console.error("YouTube Player Error:", event.data);
              // Handle errors, maybe try recreating the player or logging
              playerReady = false; // Reset ready state on error
            },
            onStateChange: (event: YT.OnStateChangeEvent) => {
              // Optional: Handle state changes (playing, paused, ended, etc.)
              console.log("Player state changed:", event.data);
              // If video ends, maybe play another random one? For now, just log.
              if (event.data === YT.PlayerState.ENDED) {
                console.log("Lofi video ended.");
                // Optionally, automatically play another random video
                // playRandomLofi();
              }
            },
          },
        });
      })
      .catch(error => {
        console.error("Failed to initialize YouTube API:", error);
      });
  });
}

export async function playRandomLofi() {
  try {
    const currentInstance = await createPlayer();
    if (!currentInstance || !playerReady) {
      console.error("Player not ready or failed to create.");
      return;
    }
    const randomIndex = Math.floor(Math.random() * LOFI_VIDEOS.length);
    const videoId = LOFI_VIDEOS[randomIndex];
    console.log(`Loading and playing video: ${videoId}`);

    // Check if loadVideoById is available (it should be after onReady)
    if (typeof currentInstance.loadVideoById === "function") {
      currentInstance.loadVideoById(videoId);
      // Play might need to be called explicitly after load or rely on autoplay
      // Let's try calling playVideo after a short delay to ensure loading starts
      setTimeout(() => {
        if (playerReady && typeof currentInstance.playVideo === "function") {
          currentInstance.playVideo();
          console.log("playVideo called.");
        } else {
          console.warn(
            "Player not ready or playVideo not available when attempting to play."
          );
        }
      }, 500); // Small delay
    } else {
      console.error("loadVideoById function not available on player instance.");
    }
  } catch (error) {
    console.error("Error playing random Lofi:", error);
  }
}

export async function stopLofi() {
  try {
    if (player && playerReady && typeof player.stopVideo === "function") {
      console.log("Stopping video.");
      player.stopVideo();
    } else {
      console.log("Player not ready or stopVideo not available, cannot stop.");
    }
  } catch (error) {
    console.error("Error stopping Lofi:", error);
  }
}
