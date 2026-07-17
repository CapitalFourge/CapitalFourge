package com.capitalfourge.portfoliomanager.infrastructure.config;

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
 * Configures the gRPC server to handle HTTP health checks (HEAD /, GET /health)
 * on the gRPC port. This prevents Render's health checks from causing Http2Exception.
 */
@Configuration
public class GrpcServerHealthConfig {

    @Bean
    public GrpcServerBuilderConfigurer grpcServerBuilderConfigurer() {
        return builder -> {
            // Add HTTP health check handler to gRPC server pipeline
            builder.channelFactory(() -> 
                new io.grpc.netty.shaded.io.netty.channel.socket.nio.NioServerSocketChannel()
            );
            
            // Add a custom channel initializer that adds HTTP codec before gRPC handler
            builder.childInitializer(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) {
                    ChannelPipeline pipeline = ch.pipeline();
                    
                    // Add HTTP codec for health check handling
                    pipeline.addLast("httpCodec", new HttpServerCodec());
                    pipeline.addLast("httpAggregator", new HttpObjectAggregator(65536));
                    
                    // Add health check handler BEFORE gRPC handler
                    pipeline.addLast("healthCheckHandler", new GrpcHealthCheckHandler());
                    
                    // gRPC handler will be added by grpc-java after this
                }
            });
        };
    }

    /**
     * Handles HTTP/1.x health check requests on the gRPC port.
     * Responds 200 OK to HEAD / and GET /health.
     * Passes through all other traffic to gRPC handler.
     */
    public static class GrpcHealthCheckHandler extends io.grpc.netty.shaded.io.netty.channel.ChannelInboundHandlerAdapter {
        
        private static final String HEALTH_PATH = "/health";
        private static final String ROOT_PATH = "/";

        @Override
        public void channelRead(io.grpc.netty.shaded.io.netty.channel.ChannelHandlerContext ctx, Object msg) {
            if (msg instanceof HttpRequest) {
                HttpRequest request = (HttpRequest) msg;
                
                // Check if it's a health check request
                boolean isHealthCheck = (HttpMethod.HEAD.equals(request.method()) || HttpMethod.GET.equals(request.method()))
                    && (ROOT_PATH.equals(request.uri()) || HEALTH_PATH.equals(request.uri()));
                
                if (isHealthCheck) {
                    HttpResponse response = new DefaultFullHttpResponse(
                        HttpVersion.HTTP_1_1,
                        HttpResponseStatus.OK,
                        Unpooled.copiedBuffer("OK", StandardCharsets.UTF_8)
                    );
                    response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain; charset=UTF-8");
                    response.headers().set(HttpHeaderNames.CONTENT_LENGTH, response.content().readableBytes());
                    response.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.CLOSE);
                    
                    ctx.writeAndFlush(response).addListener(io.grpc.netty.shaded.io.netty.channel.ChannelFutureListener.CLOSE);
                    return; // Don't pass to gRPC handler
                }
            }
            
            // Pass through to gRPC handler
            ctx.fireChannelRead(msg);
        }

        @Override
        public void exceptionCaught(io.grpc.netty.shaded.io.netty.channel.ChannelHandlerContext ctx, Throwable cause) {
            cause.printStackTrace();
            ctx.close();
        }
    }
}
