import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Skip authentication for this route. A valid token, if sent, is still attached to the request. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
