// Load help commands from commands.json and populate help modal
document.addEventListener('DOMContentLoaded', function () {
    const helpTextElement = document.querySelector('.help-text');

    if (helpTextElement) {
        fetch('commands.json')
            .then(response => response.json())
            .then(data => {
                let helpText = '';

                data.categories.forEach(category => {
                    const maxCommandLength = Math.max(...category.commands.map(c => c.command.length));

                    category.commands.forEach(cmd => {
                        const padding = ' '.repeat(maxCommandLength - cmd.command.length + 4);
                        helpText += `  ${cmd.command}${padding}- ${cmd.description}\n`;
                    });
                    helpText += '\n';
                });

                if (data.footer) {
                    helpText += `\n${data.footer}`;
                }

                helpTextElement.textContent = helpText.trimEnd();
            })
            .catch(error => {
                console.error('Error loading commands:', error);
                helpTextElement.textContent = 'Error loading help commands. Please check commands.json file.';
            });
    }
});
