export declare function omitUndefined<T extends Record<string, unknown>>(obj: T): {
    [K in keyof T]?: Exclude<T[K], undefined>;
};
export declare function undefinedToNull<T>(value: T | undefined): T | null;
//# sourceMappingURL=optional.d.ts.map