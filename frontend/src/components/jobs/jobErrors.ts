export const getJobErrorMessage = (error: unknown) => {
  const response = error as { data?: { message?: string; errors?: string[] } };
  return (
    response?.data?.errors?.[0] ??
    response?.data?.message ??
    "Something went wrong. Please try again."
  );
};
