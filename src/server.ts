import app from "./app";

import {
    env
} from "./config/env";

app.listen(
    env.port,
    () => {
        console.log(
            `Cart service running on port ${env.port}`
        );
    }
);