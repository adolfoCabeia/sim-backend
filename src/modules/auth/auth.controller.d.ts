import type { FastifyRequest, FastifyReply } from "fastify";
import type { RegisterInput, LoginInput, RefreshInput, ConfirmEmailInput, ActivateMfaInput, ForgotPasswordInput, ResetPasswordInput } from "./auth.schema.js";
export declare function registerController(request: FastifyRequest<{
    Body: RegisterInput;
}>, reply: FastifyReply): Promise<never>;
export declare function confirmEmailController(request: FastifyRequest<{
    Body: ConfirmEmailInput;
}>, reply: FastifyReply): Promise<never>;
export declare function loginController(request: FastifyRequest<{
    Body: LoginInput;
}>, reply: FastifyReply): Promise<never>;
export declare function refreshController(request: FastifyRequest<{
    Body: RefreshInput;
}>, reply: FastifyReply): Promise<never>;
export declare function logoutController(request: FastifyRequest<{
    Body: RefreshInput;
}>, reply: FastifyReply): Promise<never>;
export declare function initiateMfaController(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function confirmMfaController(request: FastifyRequest<{
    Body: ActivateMfaInput;
}>, reply: FastifyReply): Promise<never>;
export declare function forgotPasswordController(request: FastifyRequest<{
    Body: ForgotPasswordInput;
}>, reply: FastifyReply): Promise<never>;
export declare function resetPasswordController(request: FastifyRequest<{
    Body: ResetPasswordInput;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=auth.controller.d.ts.map