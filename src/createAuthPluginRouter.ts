import express, { Request, Response, Router } from "express";
import { Authenticator } from "passport";
import { default as ApiClient } from "@magda/auth-api-client";
import {
    AuthPluginConfig,
    getAbsoluteUrl
} from "@magda/authentication-plugin-sdk";
import discourse_sso from "discourse-sso";
import fetch from "isomorphic-fetch";
import urijs from "urijs";

declare module "@magda/authentication-plugin-sdk" {
    interface AuthPluginConfig {
        discourseBaseUrl?: string;
        targetAuthPluginKey?: string;
        isVisible?: boolean;
    }
}

const ADMIN_ROLE = "00000000-0000-0003-0000-000000000000";
declare module "express-session" {
    interface SessionData {
        user: {
            id: string;
        };
        nonce?: string;
    }
}

export interface AuthPluginRouterOptions {
    authorizationApi: ApiClient;
    passport: Authenticator;
    discourseConnectSecret: string;
    externalUrl: string;
    authPluginRedirectUrl: string;
    authPluginConfig: AuthPluginConfig;
}

async function selectAuthPlugin(
    externalUrl: string,
    currentPluginKey: string,
    targetAuthPluginKey?: string
): Promise<string> {
    const pluginsEndpoint = getAbsoluteUrl("/auth/plugins", externalUrl);
    const resData = await fetch(pluginsEndpoint);
    const data: AuthPluginConfig[] = await resData.json();

    if (data?.length < 2) {
        throw new Error(
            `Cannot locate at least 2 auth plugins. Found ${data?.length} plugins.`
        );
    }

    const availablePlugins = data.filter(
        (item) =>
            item?.key !== currentPluginKey &&
            item.authenticationMethod !== "PASSWORD" &&
            item.isVisible !== false
    );

    if (!availablePlugins.length) {
        throw new Error(
            `Cannot locate any suitable plugins for user authentication.`
        );
    }

    if (
        typeof targetAuthPluginKey === "string" &&
        targetAuthPluginKey.length > 1
    ) {
        const targetPlugin = availablePlugins.find(
            (item) => item.key === targetAuthPluginKey
        );
        if (!targetPlugin) {
            throw new Error(
                `Target auth plugin ${targetAuthPluginKey} is not registered with gateway. Cannot proceed to user authentication.`
            );
        }
        return targetAuthPluginKey;
    } else {
        const firstAuthPluginKey = availablePlugins?.[0]?.key;
        if (!firstAuthPluginKey) {
            throw new Error(
                `First suitable auth plugin "${JSON.stringify(
                    availablePlugins?.[0]
                )}" has no valid key. Cannot proceed to user authentication.`
            );
        }
        return firstAuthPluginKey;
    }
}

export default function createAuthPluginRouter(
    options: AuthPluginRouterOptions
): Router {
    const { discourseConnectSecret, externalUrl, authPluginConfig } = options;
    const { discourseBaseUrl, targetAuthPluginKey } = authPluginConfig;
    const discourseUtils = new discourse_sso(discourseConnectSecret);
    const authPluginReturnUrl = getAbsoluteUrl(
        `/auth/login/plugin/${authPluginConfig.key}/return`,
        externalUrl
    );

    if (!discourseBaseUrl) {
        throw new Error("Required discourseBaseUrl can't be empty!");
    }

    if (!discourseConnectSecret) {
        throw new Error("Required discourseConnectSecret can't be empty!");
    }

    const router: express.Router = express.Router();

    async function sso(req: Request, res: Response) {
        try {
            const payload = req?.query?.sso as string;
            const sig = req?.query?.sig as string;

            if (!discourseUtils.validate(payload, sig)) {
                res.status(400).send(
                    "Invalid rquest: cannot validate payload with signature."
                );
            } else {
                const nonce = discourseUtils.getNonce(payload);
                // set `nonce` for future reference
                req.session.nonce = nonce;

                if (!req?.user?.id) {
                    // magda user not logged in yet
                    // get a list of plugins from getway and decide use which one to authenticate the user
                    const selectedPluginKey = await selectAuthPlugin(
                        externalUrl,
                        authPluginConfig.key,
                        targetAuthPluginKey
                    );

                    // not logged in yet; redirect to other auth plugin for authentication
                    res.redirect(
                        getAbsoluteUrl(
                            urijs(`/auth/login/plugin/${selectedPluginKey}/`)
                                .search({ redirect: authPluginReturnUrl })
                                .toString(),
                            externalUrl
                        )
                    );
                } else {
                    res.redirect(authPluginReturnUrl);
                }
            }
        } catch (e) {
            console.error(e);
            res.status(500).send("Error: " + e);
        }
    }

    router.get("/", sso);
    router.get("/sso", sso);

    router.get("/return", async (req, res, next) => {
        try {
            const nonce = req?.session?.nonce;
            const userId = req?.user?.id;

            if (!nonce) {
                res.status(400).send(
                    "Invalid rquest: landed on `/return` endpoint without `nonce` set in session."
                );
                return;
            }

            if (!userId) {
                res.status(400).send(
                    "Invalid rquest: landed on `/return` endpoint without logged in."
                );
                return;
            }

            const authorizationApi = options.authorizationApi;

            const user = (await authorizationApi.getUser(userId)).valueOrThrow(
                new Error("Cannot locate user with id: " + userId)
            );
            const roles = await authorizationApi.getUserRoles(userId);
            const isAdmin =
                !!user?.isAdmin ||
                roles.findIndex((role) => role.id === ADMIN_ROLE) !== -1;

            const userParams = {
                nonce,
                external_id: userId,
                email: user.email,
                username: user.email,
                name: user.displayName,
                avatar_url: user.photoURL,
                admin: isAdmin
            };

            const queryStr = discourseUtils.buildLoginString(userParams);
            const baseUri = urijs(discourseBaseUrl);

            res.redirect(
                baseUri
                    .segmentCoded(
                        baseUri
                            .segmentCoded()
                            .concat(["session", "sso_login"])
                            .filter((item) => item)
                    )
                    .search(baseUri.query() + "&" + queryStr)
                    .toString()
            );
        } catch (e) {
            console.error(e);
            res.status(500).send("Error: " + e);
        }
    });

    return router;
}
