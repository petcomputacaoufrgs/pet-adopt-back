import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Custom decorator to check if sponsorship modalities are required
export function IsSponsorshipRequired(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSponsorshipRequired',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const object = args.object as any;
          // Check if sponsorship is true
          if (object.sponsorship) {
            // Ensure the value is not undefined, null, or an empty string
            return value !== undefined && value !== null && value.length > 0;
          }
          return true; // If sponsorship is not true, validation passes
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is required when sponsorship is true`;
        }
      }
    });
  };
}