import {loadTenderTs} from "./tender-upgrade-loader.mjs";

export const mobility=loadTenderTs("src/lib/mobility/city.ts",{
  "./currencies":loadTenderTs("src/lib/mobility/currencies.ts"),
});
