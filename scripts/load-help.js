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
                        const padding = ' '.repeat(maxCommandLength - cmd.command.length + 2);
                        // Escape HTML entities for display
                        const escapedCommand = cmd.command
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;');
                        helpText += `          ${escapedCommand}${padding}- ${cmd.description}\n`;
                    });
                    helpText += '\n';
                });

                if (data.footer) {
                    helpText += `          ${data.footer}`;
                }

                helpTextElement.textContent = helpText.trimEnd();
            })
            .catch(error => {
                console.error('Error loading commands:', error);
                helpTextElement.textContent = 'Error loading help commands. Please check commands.json file.';
            });
    }
});
