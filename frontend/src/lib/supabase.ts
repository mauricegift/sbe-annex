// Re-export the GitHub CDN upload function as the main upload method
export { uploadToGithubCdn as uploadFile } from './githubCdn';

// Legacy alias for backward compatibility
import { uploadToGithubCdn } from './githubCdn';
export const uploadFileToSupabase = uploadToGithubCdn;