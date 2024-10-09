import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class HasSocialMediaPipe implements PipeTransform {
  transform(value: any) {
    const hasSocialMedia =
      value.facebook ||
      value.instagram ||
      value.twitter ||
      value.otherSocialMedia;
    if (!hasSocialMedia) {
      throw new BadRequestException(
        'NGO must have at least one social media account.',
      );
    }
    return value;
  }
}
