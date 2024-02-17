import Decimal from "decimal.js";

export function printData(o: object) {
    const jsonStr = JSON.stringify(
        o,
        (_, value) => {
            // handle BigInt
            if (typeof value === 'bigint') {
                return value.toString();
            }
            // handle dates
            if (value instanceof Date) {
                return value.toISOString();
            }
            // handle decimals
            if (value instanceof Decimal) {
                return value.toString();
            }
            return value;
        }
    );

    const data = JSON.parse(jsonStr);
    console.dir(data, { depth: null });
}
