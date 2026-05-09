const { validationResult } = require('express-validator');

function requiredFields(...fields) {
    return (req, res, next) => {
        const missing = fields.filter(f => {
            const val = req.body[f];
            return val === undefined || val === null || val === '';
        });
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `缺少必填参数: ${missing.join(', ')}`
            });
        }
        next();
    };
}

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg
        });
    }
    next();
}

module.exports = { requiredFields, handleValidationErrors };
