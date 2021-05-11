# magda-auth-template

![Version: 1.0.0](https://img.shields.io/badge/Version-1.0.0-informational?style=flat-square)

A Magda Authentication Plugin Template. You can use this as a base to build your own Magda Authentication Plugin.

Requires MAGDA version 0.0.58 or above.

### How to Use

1. Add the auth plugin as a [Helm Chart Dependency](https://helm.sh/docs/helm/helm_dependency/)
```yaml
- name: magda-auth-xxxxx
  version: x.x.x
  repository: https://charts.magda.io
  tags:
    - all
    - magda-auth-xxxxx
```

2. Config the auth plugin with required parameters
```yaml
magda-auth-xxxxx:
  param1: value1
  param2: value2
```

3. Config Gatway to add the auth plugin to Gateway's plugin list (More details see [here](https://github.com/magda-io/magda/blob/master/deploy/helm/internal-charts/gateway/README.md))
```yaml
gateway:
  authPlugins:
  - key: xxxxx
    baseUrl: http://magda-auth-xxxxx
```

## About this document

This document is auto-generated from helm chart [values file](deploy/magda-auth-template/values.yaml) comments and template [README.md.gotmpl](./README.md.gotmpl) using [helm-docs](https://github.com/norwoodj/helm-docs).

Once you installed `helm-docs`, you can re-generate the docs by running:

```
yarn helm-docs
```

## How to use this template repo

To generate a new repo from this template repo, please see [here](https://docs.github.com/en/free-pro-team@latest/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template).

If you are new to this, please have a read [Authentication Plugin Specification](https://github.com/magda-io/magda/blob/master/docs/docs/authentication-plugin-spec.md).

Once you create a new repo, you can:
- Replace `magda-auth-template` keywords with your auth plugin name
- Add your authentication logic to [createAuthPluginRouter.ts](./src/createAuthPluginRouter.ts)
  - You can find passport.js `strategies` that support different IDPs (identity providers) or authentication servers from [here](http://www.passportjs.org/packages/).
- Update authentication config in [index.ts](./src/index.ts)
- Update environment variable defined in [github action workflow files](./.github/workflows) to your config to get [Github Action](https://docs.github.com/en/free-pro-team@latest/actions) CI running.

> Magda provides NPM packages [@magda/authentication-plugin-sdk](https://www.npmjs.com/package/@magda/authentication-plugin-sdk) and [@magda/auth-api-client](https://www.npmjs.com/package/@magda/auth-api-client) that you may need to implement your authentication logic.

To release a docker hub image & helm chart, just [create a release](https://docs.github.com/en/free-pro-team@latest/github/administering-a-repository/managing-releases-in-a-repository#creating-a-release) in your Github repo. This will trigger the CI job to:
- Run test cases (if any)
- Build the docker image
- Publish docker image to Docker Hub
- Publish the helm chart to your S3 bucket

## How to Customise Authentication Process

Here is [an example](https://github.com/magda-io/magda-auth-google/commit/f8d6ce53c64b8f1de9a64daf1a6ee2358177d39e) (based on [magda-auth-google](https://github.com/magda-io/magda-auth-google)) to show:
How you can :
- Decide & Set user's organisation unit by matching user's profile
- Decide & set user's role by matching user's profile
- Customised session data
- More non-authentication related HTTP endpoints

## Requirements

Kubernetes: `>= 1.14.0-0`

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| authPluginConfig.authenticationMethod | string | `"IDP-URI-REDIRECTION"` | The authentication method of the plugin. Support values are: <ul> <li>`IDP-URI-REDIRECTION`: the plugin will rediredct user agent to idp (identity provider) for authentication. e.g. Google & fackebook oauth etc.</li> <li>`PASSWORD`: the plugin expect frontend do a form post that contains username & password to the plugin for authentication.</li> <li>`QR-CODE`: the plugin offers a url that is used by the frontend to request auth challenge data. The data will be encoded into a QR-code image and expect the user scan the QR code with a mobile app to complete the authentication request.</li> </ul> See [Authentication Plugin Specification](https://github.com/magda-io/magda/blob/master/docs/docs/authentication-plugin-spec.md) for more details |
| authPluginConfig.iconUrl | string | `"/icon.svg"` | the display icon URL of the auth plugin. |
| authPluginConfig.key | string | `"test-auth-plugin"` | the unique key of the auth plugin. Allowed characters: [a-zA-Z0-9\-] |
| authPluginConfig.loginFormExtraInfoContent | string | `""` | Optional; Only applicable when authenticationMethod = "PASSWORD". If present, will displayed the content underneath the login form to provide extra info to users. e.g. how to reset password Can support content in markdown format. |
| authPluginConfig.loginFormExtraInfoHeading | string | `""` | Optional; Only applicable when authenticationMethod = "PASSWORD". If present, will displayed the heading underneath the login form to provide extra info to users. e.g. how to reset password |
| authPluginConfig.loginFormPasswordFieldLabel | string | "Password" | Optional; Only applicable when authenticationMethod = "PASSWORD". |
| authPluginConfig.loginFormUsernameFieldLabel | string | "Username" | Optional; Only applicable when authenticationMethod = "PASSWORD". |
| authPluginConfig.name | string | `"Test Auth Plugin"` | the display name of the auth plugin. |
| authPluginConfig.qrCodeAuthResultPollUrl | string | `""` | Only applicable & compulsory when authenticationMethod = "QR-CODE". The url that is used by frontend to poll the authentication processing result. See [Authentication Plugin Specification](https://github.com/magda-io/magda/blob/master/docs/docs/authentication-plugin-spec.md) for more details |
| authPluginConfig.qrCodeExtraInfoContent | string | `""` | Only applicable & compulsory when authenticationMethod = "QR-CODE". If present, will displayed the content underneath the login form to provide extra info to users. e.g. how to download moile app to scan the QR Code. Can support content in markdown format. |
| authPluginConfig.qrCodeExtraInfoHeading | string | `""` | Only applicable & compulsory when authenticationMethod = "QR-CODE". If present, will displayed the heading underneath the QR Code image to provide extra instruction to users. e.g. how to download moile app to scan the QR Code |
| authPluginConfig.qrCodeImgDataRequestUrl | string | `""` | Only applicable & compulsory when authenticationMethod = "QR-CODE". The url that is used by frontend client to request auth challenge data from the authentication plugin. See [Authentication Plugin Specification](https://github.com/magda-io/magda/blob/master/docs/docs/authentication-plugin-spec.md) for more details |
| authPluginRedirectUrl | string | `nil` | the redirection url after the whole authentication process is completed. Authentication Plugins will use this value as default. The following query paramaters can be used to supply the authentication result: <ul> <li>result: (string) Compulsory. Possible value: "success" or "failure". </li> <li>errorMessage: (string) Optional. Text message to provide more information on the error to the user. </li> </ul> This field is for overriding the value set by `global.authPluginRedirectUrl`. Unless you want to have a different value only for this auth plugin, you shouldn't set this value. |
| authPluginRedirectUrl | string | `nil` | the redirection url after the whole authentication process is completed. Authentication Plugins will use this value as default. The following query paramaters can be used to supply the authentication result: <ul> <li>result: (string) Compulsory. Possible value: "success" or "failure". </li> <li>errorMessage: (string) Optional. Text message to provide more information on the error to the user. </li> </ul> This field is for overriding the value set by `global.authPluginRedirectUrl`. Unless you want to have a different value only for this auth plugin, you shouldn't set this value. |
| autoscaler.enabled | bool | `false` | turn on the autoscaler or not |
| autoscaler.maxReplicas | int | `3` |  |
| autoscaler.minReplicas | int | `1` |  |
| autoscaler.targetCPUUtilizationPercentage | int | `80` |  |
| defaultAdminUserId | string | `"00000000-0000-4000-8000-000000000000"` | which system account we used to talk to auth api The value of this field will only be used when `global.defaultAdminUserId` has no value |
| defaultImage.imagePullSecret | bool | `false` |  |
| defaultImage.pullPolicy | string | `"IfNotPresent"` |  |
| defaultImage.repository | string | `"docker.io/data61"` |  |
| global | object | `{"authPluginRedirectUrl":"/sign-in-redirect","externalUrl":"","image":{},"rollingUpdate":{}}` | only for providing appropriate default value for helm lint |
| image | object | `{}` |  |
| replicas | int | `1` | no. of initial replicas |
| resources.limits.cpu | string | `"50m"` |  |
| resources.requests.cpu | string | `"10m"` |  |
| resources.requests.memory | string | `"30Mi"` |  |
