module.exports = {
    handleDatabaseError: (err, res) => {
        console.error("Datenbankfehler:", err);
        res.status(500).json({
            error: "Interner Serverfehler. Bitte versuchen Sie es später erneut."
        });
    },

    handleValidationError: (message, res) => {
        console.warn("Validierungsfehler:", message);
        res.status(400).json({
            error: message
        });
    },
};
