/**
 * Describe the readonly plain-data result produced by descriptor copying.
 */
type DescriptorDataCopy<T> =
	T extends ArrayBufferView
		? readonly number[]
		: T extends readonly (infer Entry)[]
			? readonly DescriptorDataCopy<Entry>[]
			: T extends object
				? { readonly [Key in keyof T]: DescriptorDataCopy<T[Key]> }
				: T;
