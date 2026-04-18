export type TitanPlatformUser = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role_names: string[];
    permissions: string[];
    is_active: boolean;
    mfa_enabled: boolean;
};

export type PlatformLoginInput = {
    email: string;
    password: string;
};

export type PlatformLoginResponse = {
    access_token: string;
    token_type: string;
    user: TitanPlatformUser;
};
