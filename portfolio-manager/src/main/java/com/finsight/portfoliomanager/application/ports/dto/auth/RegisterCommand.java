package com.finsight.portfoliomanager.application.ports.dto.auth;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterCommand {
    String email;
    String password;
    String username;
}
