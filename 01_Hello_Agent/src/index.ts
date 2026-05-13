//Entry file

import { loadEnv } from "./env";
import { selectAndHello } from "./provider";

async function main(){
    loadEnv();

    try {
        const result = await selectAndHello();

        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        process.exit(0);
        
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        console.error(`Error: ${message}`);

        process.exit(1);
    }
}

main();