export const invitationService = {
  accept: async (userId: string, token: string) => {
    return { id: 'membershipId' };
  },
  decline: async (userId: string, token: string) => {
    return true;
  }
};
