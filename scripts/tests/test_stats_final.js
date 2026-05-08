const { getStats } = require("./src/services/systemService");

async function testStats() {
    try {
        const stats = await getStats();
        console.log(JSON.stringify(stats, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

testStats();
