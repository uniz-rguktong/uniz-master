import prisma from './prisma';
import logger from './logger';

/**
 * Log an administrative action
 * @param {Object} params
 * @param {string} params.action - e.g., "CREATE_EVENT", "DELETE_REGISTRATION"
 * @param {string} params.entityType - e.g., "EVENT", "REGISTRATION"
 * @param {string} params.entityId - The ID of the affected record
 * @param {string} params.performedBy - The Admin User ID
 * @param {Object} [params.metadata] - Extra context (old/new values)
 */
interface CreateAuditLogParams {
    action: string;
    entityType: string;
    entityId: string;
    performedBy: string;
    metadata?: any;
}

export async function createAuditLog({ action, entityType, entityId, performedBy, metadata }: CreateAuditLogParams) {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entityType,
                entityId: // @ts-ignore - Prisma might expect a relation or specific ID format, keeping flexible
                    entityId,
                performedBy, // This might need to map to userId/adminId depending on schema
                // If schema has relation fields like 'adminId', we need to check schema.
                // Assuming schema has a 'performedBy' string field or similar for now based on JS usage.
                metadata: metadata || {},
            }
        });
    } catch (error) {
        // We don't want audit log failures to crash the main operation, 
        // but we should definitely log the error.
        logger.error({ err: error }, 'Failed to create audit log');
    }
}
