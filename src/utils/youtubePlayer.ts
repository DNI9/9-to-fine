import { LOFI_VIDEOS } from "./lofiVideos";

let player: YT.Player | null = null;
let playerReady = false;

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: typeof YT;
  }
}

const youtubeApiReady = new Promise<void>(resolve => {
  if (document.getElementById("youtube-iframe-api")) {
    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube IFrame API ready (already loaded).");
      resolve();
    };
    if (window.YT && window.YT.Player) {
      console.log("YouTube IFrame API ready (window.YT exists).");
      resolve();
    }
  } else {
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

    let playerContainer = document.getElementById("youtube-player-container");
    if (!playerContainer) {
      playerContainer = document.createElement("div");
      playerContainer.id = "youtube-player-container";
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
          height: "1",
          width: "1",
          playerVars: {
            playsinline: 1,
          },
          events: {
            onReady: () => {
              console.log("YouTube Player Ready.");
              playerReady = true;
              resolve(player!);
            },
            onError: (event: YT.OnErrorEvent) => {
              console.error("YouTube Player Error:", event.data);
              playerReady = false;
            },
            onStateChange: (event: YT.OnStateChangeEvent) => {
              console.log("Player state changed:", event.data);
              if (event.data === YT.PlayerState.ENDED) {
                console.log("Lofi video ended.");
                playRandomLofi();
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

    if (typeof currentInstance.loadVideoById === "function") {
      currentInstance.loadVideoById(videoId);
      setTimeout(() => {
        if (playerReady && typeof currentInstance.playVideo === "function") {
          currentInstance.playVideo();
          console.log("playVideo called.");
        } else {
          console.warn(
            "Player not ready or playVideo not available when attempting to play."
          );
        }
      }, 500);
    } else {
      console.error("loadVideoById function not available on player instance.");
    }
  } catch (error) {
    console.error("Error playing random Lofi:", error);
  }
}

export async function pauseLofi() {
  try {
    if (
      player &&
      playerReady &&
      typeof player.pauseVideo === "function" &&
      player.getPlayerState() === YT.PlayerState.PLAYING
    ) {
      console.log("Pausing video.");
      player.pauseVideo();
    } else {
      console.log(
        "Player not ready, not playing, or pauseVideo not available, cannot pause."
      );
    }
  } catch (error) {
    console.error("Error pausing Lofi:", error);
  }
}

export async function resumeLofi(): Promise<boolean> {
  try {
    if (
      player &&
      playerReady &&
      typeof player.playVideo === "function" &&
      player.getPlayerState() === YT.PlayerState.PAUSED
    ) {
      console.log("Resuming video.");
      player.playVideo();
      return true;
    } else {
      console.log(
        "Player not ready, not paused, or playVideo not available, cannot resume."
      );
      return false;
    }
  } catch (error) {
    console.error("Error resuming Lofi:", error);
    return false;
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
