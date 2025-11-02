
export const fileToBase64 = (file: File): Promise<{ base64Data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // The result is a data URL like "data:image/jpeg;base64,LzlqLzRBQ...".
      // We need to split it to get the base64 part.
      const base64Data = result.split(',')[1];
      const mimeType = result.split(';')[0].split(':')[1];
      resolve({ base64Data, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};
