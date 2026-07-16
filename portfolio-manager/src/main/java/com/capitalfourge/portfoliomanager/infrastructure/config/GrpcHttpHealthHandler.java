package com.capitalfourge.portfoliomanager.infrastructure.config;

import io.grpc.netty.shaded.io.netty.channel.ChannelHandlerContext;
import io.grpc.netty.shaded.io.netty.channel.ChannelInboundHandlerAdapter;
import io.grpc.netty.shaded.io.netty.handler.codec.http.*;
import io.grpc.netty.shaded.io.netty.buffer.Unpooled;
import io.grpc.netty.shaded.io.netty.util.CharsetUtil;
import io.grpc.netty.shaded.io.netty.handler.codec.http2.Http2ConnectionHandler;
import io.grpc.netty.shaded.io.netty.channel.ChannelPipeline;

import java.nio.charset.StandardCharsets;

/**
 * Handler that allows gRPC server port to also respond to HTTP health checks.
 * Detects HTTP/1.x requests (HEAD/GET /health) and responds with 200 OK,
 * while passing through gRPC (HTTP/2) traffic normally.
 */
public class GrpcHttpHealthHandler extends ChannelInboundHandlerAdapter {

    private static final String HEALTH_PATH = "/health";
    private static final String ROOT_PATH = "/";

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        // Check if this is an HTTP/1.x request (not HTTP/2/gRPC)
        if (msg instanceof HttpRequest) {
            HttpRequest request = (HttpRequest) msg;
            
            // Handle HEAD / and GET /health for health checks
            if ((HttpMethod.HEAD.equals(request.method()) || HttpMethod.GET.equals(request.method()))
                    && (ROOT_PATH.equals(request.uri()) || HEALTH_PATH.equals(request.uri()))) {
                
                HttpResponse response = new DefaultFullHttpResponse(
                    HttpVersion.HTTP_1_1,
                    HttpResponseStatus.OK,
                    Unpooled.copiedBuffer("OK", StandardCharsets.UTF_8)
                );
                response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain; charset=UTF-8");
                response.headers().set(HttpHeaderNames.CONTENT_LENGTH, response.content().readableBytes());
                response.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.CLOSE);
                
                ctx.writeAndFlush(response).addListener(io.grpc.netty.shaded.io.netty.channel.ChannelFutureListener.CLOSE);
                return; // Don't pass HTTP request to gRPC handler
            }
            
            // For other HTTP requests, respond 404 but don't crash
            if (HttpMethod.HEAD.equals(request.method()) || HttpMethod.GET.equals(request.method())) {
                HttpResponse response = new DefaultFullHttpResponse(
                    HttpVersion.HTTP_1_1,
                    HttpResponseStatus.NOT_FOUND,
                    Unpooled.copiedBuffer("Not Found", StandardCharsets.UTF_8)
                );
                response.headers().set(HttpHeaderNames.CONTENT_TYPE, "text/plain; charset=UTF-8");
                response.headers().set(HttpHeaderNames.CONTENT_LENGTH, response.content().readableBytes());
                response.headers().set(HttpHeaderNames.CONNECTION, HttpHeaderValues.CLOSE);
                
                ctx.writeAndFlush(response).addListener(io.grpc.netty.shaded.io.netty.channel.ChannelFutureListener.CLOSE);
                return;
            }
        }
        
        // Pass through gRPC (HTTP/2) and other traffic
        ctx.fireChannelRead(msg);
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        // Log but don't crash on protocol errors
        if (cause instanceof io.grpc.netty.shaded.io.netty.handler.codec.http2.Http2Exception) {
            // This is expected when HTTP/1.x hits HTTP/2 port - we handle it above
            return;
        }
        cause.printStackTrace();
        ctx.close();
    }
}
