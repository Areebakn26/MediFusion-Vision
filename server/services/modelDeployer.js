'use strict';

const axios = require('axios');
const { ModelVersion } = require('../models');

const BRAIN_URL   = `http://localhost:${process.env.BRAIN_MODEL_PORT   || 5003}`;
const RETINAL_URL = `http://localhost:${process.env.RETINAL_MODEL_PORT || 5002}`;

// ─── 1. Register a new model version in the DB ───────────────────────────────
/**
 * Insert a new row into model_versions.
 * @param {string} modelType  - 'tumor' | 'alzheimer' | 'retinal'
 * @param {string} versionTag - e.g. 'tumor_v20260427_143000.pth'
 * @param {string} filePath   - absolute path on the server
 * @param {number} accuracy   - 0.0–1.0
 * @returns {Promise<ModelVersion>}
 */
const registerNewVersion = async (modelType, versionTag, filePath, accuracy) => {
    const version = await ModelVersion.create({
        model_type:  modelType,
        version_tag: versionTag,
        file_path:   filePath,
        accuracy:    accuracy != null ? parseFloat(accuracy) : null,
        is_active:   false,   // not deployed yet
    });

    console.log(
        `[ModelDeployer] Registered ${modelType} version "${versionTag}" ` +
        `(accuracy=${accuracy}, id=${version.id})`
    );
    return version;
};

// ─── 2. Deploy a model version (swap active flag + tell Python to reload) ────
/**
 * Set a version as active, deactivate the old one, and call Python to reload.
 * @param {string} modelType
 * @param {string} versionTag
 * @returns {Promise<{ success: boolean, version: ModelVersion }>}
 */
const deployModel = async (modelType, versionTag) => {
    const target = await ModelVersion.findOne({
        where: { model_type: modelType, version_tag: versionTag },
    });
    if (!target) {
        throw new Error(`Version "${versionTag}" not found for model type "${modelType}"`);
    }

    // Deactivate all versions of this model type
    await ModelVersion.update(
        { is_active: false },
        { where: { model_type: modelType } }
    );

    // Activate the target version
    await target.update({ is_active: true });

    console.log(`[ModelDeployer] Deployed ${modelType} version "${versionTag}"`);

    // Tell the appropriate Python service to reload
    try {
        const baseUrl = modelType === 'retinal' ? RETINAL_URL : BRAIN_URL;
        await axios.post(`${baseUrl}/reload`, {
            model_type:   modelType,
            version_tag:  versionTag,
            file_path:    target.file_path,
        }, { timeout: 30_000 });
        console.log(`[ModelDeployer] Python service reloaded for ${modelType}`);
    } catch (err) {
        // Non-fatal — DB state is already updated; Python reload can be retried
        console.warn(`[ModelDeployer] Python reload call failed (non-fatal): ${err.message}`);
    }

    return { success: true, version: target };
};

// ─── 3. Rollback to a previous version ───────────────────────────────────────
/**
 * Find an existing version and re-deploy it as active.
 * @param {string} modelType
 * @param {string} targetVersion - version_tag to roll back to
 * @returns {Promise<{ success: boolean, version: ModelVersion }>}
 */
const rollbackModel = async (modelType, targetVersion) => {
    const version = await ModelVersion.findOne({
        where: { model_type: modelType, version_tag: targetVersion },
    });
    if (!version) {
        throw new Error(
            `Cannot rollback: version "${targetVersion}" not found for "${modelType}"`
        );
    }

    console.log(`[ModelDeployer] Rolling back ${modelType} to "${targetVersion}"`);
    return deployModel(modelType, targetVersion);
};

module.exports = { registerNewVersion, deployModel, rollbackModel };
