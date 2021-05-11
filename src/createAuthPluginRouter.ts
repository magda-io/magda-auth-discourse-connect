import express, { Router } from "express";
import { Authenticator } from "passport";
import { default as ApiClient } from "@magda/auth-api-client";
import { AuthPluginConfig } from "@magda/authentication-plugin-sdk";

export interface AuthPluginRouterOptions {
    authorizationApi: ApiClient;
    passport: Authenticator;
    clientId: string; // clientId that might be required by your IDP provider
    clientSecret: string; // clientSecret that might be required by your IDP provider
    externalUrl: string;
    authPluginRedirectUrl: string;
    authPluginConfig: AuthPluginConfig;
}

export default function createAuthPluginRouter(
    options: AuthPluginRouterOptions
): Router {
    //const authorizationApi = options.authorizationApi;
    //const passport = options.passport;
    const clientId = options.clientId;
    const clientSecret = options.clientSecret;
    //const externalUrl = options.externalUrl;
    //const loginBaseUrl = `${externalUrl}/auth/login/plugin`;
    /*const resultRedirectionUrl = getAbsoluteUrl(
        options.authPluginRedirectUrl,
        externalUrl
    );*/

    if (!clientId) {
        throw new Error("Required client id can't be empty!");
    }

    if (!clientSecret) {
        throw new Error("Required client secret can't be empty!");
    }

    const router: express.Router = express.Router();

    // You can use passport to setup http endpoint for your authentication plugin using a `passport strategy`.
    // You can find passport.js `strategies` that support different IDPs (identity providers) or authentication servers from [here](http://www.passportjs.org/packages/).
    // You can find an example [here](https://github.com/magda-io/magda-auth-google)

    return router;
}
