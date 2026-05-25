export function useBase64() {
  function encode(value: string) {
    return btoa(value);
  }

  function decode(value: string) {
    return atob(value);
  }

  return {
    encode,
    decode,
  };
}
