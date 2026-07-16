package com.capitalfourge.portfoliomanager.infrastructure.config;

import io.grpc.netty.shaded.io.netty.channel.Channel;
import io.grpc.netty.shaded.io.netty.channel.ChannelInitializer;
import io.grpc.netty.shaded.io.netty.channel.ChannelPipeline;
import io.grpc.netty.shaded.io.netty.channel.socket.SocketChannel;
import io.grpc.netty.shaded.io.netty.handler.codec.http.*;
import io.grpc.netty.shaded.io.netty.buffer.Unpooled;
import io.grpc.netty.shaded.io.netty.util.CharsetUtil;
import net.devh.boot.grpc.server.autoconfigure.GrpcServerBuilderConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.charset.StandardCharsets;

/**
 * Configures the gRPC server to handle HTTP/1.x health checks on the gRPC port.
 * This prevents Http2Exception when Render health checks hit the gRPC port with HTTP/1.x requests.
 */
@Configuration
public class GrpcServerHealthConfig {

    @Bean
    public GrpcServerBuilderConfigurer grpcServerBuilderConfigurer() {
        return builder -> {
            // Add a custom channel initializer that adds HTTP health check handling
            builder.addServiceInterceptor((call, next) -> next); // placeholder
            
            // The actual fix: configure the Netty server to handle HTTP/1.x on gRPC port
            builder.channelFactory(() -> {
                return new io.grpc.netty.shaded.io.netty.channel.socket.nio.NioServerSocketChannel();
            });
            
            // Use a custom channel initializer factory to add our HTTP handler
            builder.childInitializer(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) {
                    ChannelPipeline pipeline = ch.pipeline();
                    
                    // Add HTTP codec first (for HTTP/1.x requests)
                    pipeline.addLast("httpCodec", new HttpServerCodec());
                    pipeline.addLast("httpAggregator", new HttpObjectAggregator(65536));
                    
                    // Add our health check handler BEFORE gRPC handler
                    pipeline.addLast("healthCheckHandler", new GrpcHttpHealthHandler());
                    
                    // The gRPC handler will be added by grpc-java after this
                }
            });
        };
    }
}
