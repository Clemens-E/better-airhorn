import { BClient } from "../struct/client";

module.exports = (client: BClient) => {
    console.log(`ready as ${client.user.tag}`);
}