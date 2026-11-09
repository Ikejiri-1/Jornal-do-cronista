export const RAUL_PROFILE_ID: string;
export const PROFILE_BIO_MAX_LENGTH: number;
export const PROFILE_NAME_MAX_LENGTH: number;
export function profileHasData(id: string): boolean;
export function latestStoryOf(id: string): { pen?: string } | null;
export function profileNameOf(id: string): string;
export function profileBioOf(id: string): string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function profileStoriesOf(id: string): any[];
export function followersOf(id: string): string[];
export function followingOf(id: string): string[];
export function isFollowing(id: string): boolean;
export function profileIdOfItem(item: unknown): string | undefined;
