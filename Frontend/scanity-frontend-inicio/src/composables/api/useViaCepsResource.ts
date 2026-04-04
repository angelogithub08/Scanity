import { axios } from 'src/boot/axios';

export function useViaCepsResource() {
  function getAddressByZipcode(zipcode: string) {
    return axios.get(`https://viacep.com.br/ws/${zipcode}/json/`);
  }

  return {
    getAddressByZipcode,
  };
}
