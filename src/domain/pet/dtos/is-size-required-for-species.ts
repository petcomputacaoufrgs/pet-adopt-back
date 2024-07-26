import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Custom decorator to check if size is required for certain species
export function IsSizeRequiredForSpecies(validationOptions?: ValidationOptions) {
  // Return a function that registers the decorator
  return function (object: Object, propertyName: string) {
	registerDecorator({
	  name: 'isSizeRequiredForSpecies', // Name of the custom decorator
	  target: object.constructor, // Target class
	  propertyName: propertyName, // Property to which the decorator is applied
	  options: validationOptions, // Validation options
	  validator: {
		// Function to validate the property value
		validate(value: any, args: ValidationArguments) {
		  const object = args.object as any; // Get the object being validated
		  // Check if the species is either 'Gato' or 'Cachorro'
		  if (['Gato', 'Cachorro'].includes(object.species)) {
			// Ensure the value is not undefined, null, or an empty string
			return value !== undefined && value !== null && value !== '';
		  }
		  return true; // If species is not 'Gato' or 'Cachorro', validation passes
		},
		// Default error message if validation fails
		defaultMessage(args: ValidationArguments) {
		  return `${args.property} is required when species is Gato or Cachorro`;
		}
	  }
	});
  };
}