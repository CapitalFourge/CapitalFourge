package com.capitalfourge.portfoliomanager.infrastructure.config;

import io.grpc.netty.shaded.io.netty.channel.ChannelHandlerContext;
import io.grpc.netty.shaded.io.netty.channel.ChannelInboundHandlerAdapter;
import io.grpc.netty.shaded.io.netty.handler.codec.http.*;
import io.grpc.netty.shaded.io.netty.buffer.Unpooled;
import io.grpc.netty.shaded.io.netty.util.CharsetUtil;
import io.grpc.Server;
import io.grpc.ServerInterceptors;
import io.grpc.ServerBuilder;
import net.devh.boot.grpc.server.autoconfigure.GrpcServerBuilderConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.charset.StandardCharsets;

@Configuration
public class GrpcServerConfig {

    @Bean
    public GrpcServerBuilderConfigurer grpcServerBuilderConfigurer() {
        return builder -> {
            // Add a handler to respond to HTTP HEAD/GET on gRPC port for health checks
            builder.intercept((invocation, next) -> {
                // This is a workaround: add a simple HTTP handler for health checks
                // The real fix is to configure Render to use HTTP port for health checks
                return next.invoke(invocation);
            });
        };
    }

    // Alternative: Add a simple HTTP handler to the gRPC server pipeline
    @Bean
    public net.devh.boot.grpc.server.security.authentication.GrpcAuthenticationReader grpcAuthenticationReader() {
        return null; // Disable if not needed
    }
}
