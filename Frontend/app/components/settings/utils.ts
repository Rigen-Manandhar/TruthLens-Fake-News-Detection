export const formatDate = (value: string | null) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};

export const parseError = async (res: Response, fallback: string) => {
  const json = (await res.json().catch(() => null)) as
    | { error?: string; detail?: string }
    | null;

  return json?.error ?? json?.detail ?? fallback;
};
