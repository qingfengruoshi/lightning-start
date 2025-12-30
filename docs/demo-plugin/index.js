module.exports = {
    search: async (query) => {
        return [
            {
                title: 'Hello from External Plugin!',
                subtitle: `You typed: "${query}"`,
                action: 'copy',
                data: `Hello World! You typed: ${query}`
            },
            {
                title: 'Click me to run execute test',
                subtitle: 'Console log test',
                action: 'console',
                data: 'Execute works!'
            }
        ];
    },
    execute: async (result) => {
        // result contains the full SearchResult object
        console.log('External Plugin Executed!', result);

        // You can interact with system here if environment allows
        // e.g. require('child_process').exec('calc');

        if (result.data?.payload === 'Execute works!') {
            console.log('Specific action triggered!');
        }
    }
};
