declare const brand: unique symbol;

export type BrandedType<T, B> = T & { [brand]: B };
