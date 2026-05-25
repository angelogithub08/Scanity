import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Profile } from 'src/interfaces/profiles';
import { ref } from 'vue';

export const useProfilesStore = defineStore('profiles', () => {
  const currentProfile = ref<Partial<Profile>>();
  const profiles = ref<Partial<Profile>[]>([]);

  function setCurrentProfile(data: Partial<Profile>) {
    currentProfile.value = data;
  }

  function setProfiles(data: Partial<Profile>[]) {
    profiles.value = data;
  }

  return { profiles, setProfiles, currentProfile, setCurrentProfile };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfilesStore, import.meta.hot));
}
