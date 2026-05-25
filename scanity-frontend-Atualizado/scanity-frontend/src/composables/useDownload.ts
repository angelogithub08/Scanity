export function useDownload() {
  function downloadFromHttpResponse(response: any, fileName: string) {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    downloadFromHttpResponse,
  };
}
