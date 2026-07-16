package com.capitalfourge.portfoliomanager.infrastructure.config;

import io.grpc.netty.shaded.io.netty.channel.Channel;
import io.grpc.netty.shaded.io.netty.channel.ChannelInitializer;
import io.grpc.netty.shaded.io.netty.channel.socket.SocketChannel;
import io.grpc.netty.shaded.io.netty.handler.codec.http.HttpObjectAggregator;
import io.grpc.netty.shaded.io.netty.handler.codec.http.HttpServerCodec;
import net.devh.boot.grpc.server.autoconfigure.GrpcServerFactoryConfigurer;
import net.devh.boot.grpc.server.autoconfigure.GrpcServerProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GrpcServerConfig {

    @Autowired
    private GrpcHttpHealthHandler grpcHttpHealthHandler;

    @Bean
    public GrpcServerFactoryConfigurer grpcServerFactoryConfigurer(GrpcServerProperties properties) {
        return builder -> {
            builder.channelFactory(() -> new io.grpc.netty.shaded.io.netty.channel.socket.nio.NioServerSocketChannel());
            
            // Add HTTP health check handler to gRPC server pipeline
            builder.childInitializer(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) {
                    ch.pipeline()
                        .addLast("httpCodec", new HttpServerCodec())
                        .addLast("httpAggregator", new HttpObjectAggregator(65536))
                        .addLast("healthCheckHandler", grpcHttpHealthHandler);
                    // gRPC handler will be added by grpc-java after this
                }
            });
        };
    }
}
