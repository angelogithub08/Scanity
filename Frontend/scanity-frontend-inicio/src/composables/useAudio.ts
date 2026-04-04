export function useAudio() {
  function getAudio(): HTMLAudioElement {
    return document.getElementById('notification-sound') as HTMLAudioElement;
  }

  function playAudio() {
    const audio = getAudio();
    void audio.play();
  }

  return { getAudio, playAudio };
}
