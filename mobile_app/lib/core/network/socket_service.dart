import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../constants/api_constants.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

  void connect(String token) {
    _socket = IO.io(
      ApiConstants.socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .disableAutoConnect()
          .build(),
    );
    _socket!.connect();

    _socket!.onConnect((_) => print('[Socket] Connected'));
    _socket!.onDisconnect((_) => print('[Socket] Disconnected'));
    _socket!.onError((e) => print('[Socket] Error: $e'));
  }

  void joinRoom(String roomId) {
    _socket?.emit('join_room', roomId);
  }

  void sendMessage({
    required String room,
    required String appointmentId,
    required String author,
    required String message,
  }) {
    _socket?.emit('send_message', {
      'room': room,
      'appointmentId': appointmentId,
      'author': author,
      'message': message,
    });
  }

  void sendNote({
    required String room,
    required String note,
    required String doctorId,
  }) {
    _socket?.emit('send_note', {
      'room': room,
      'note': note,
      'doctorId': doctorId,
    });
  }

  void onReceiveMessage(Function(dynamic) callback) {
    _socket?.on('receive_message', callback);
  }

  void onReceiveNote(Function(dynamic) callback) {
    _socket?.on('receive_note', callback);
  }

  void notifyPatientJoined({
    required String room,
    required String appointmentId,
    required String patientName,
  }) {
    _socket?.emit('patient_joined', {
      'room': room,
      'appointmentId': appointmentId,
      'patientName': patientName,
    });
  }

  void onPatientJoinedConsultation(Function(dynamic) callback) {
    _socket?.on('patient_joined_consultation', callback);
  }

  void offPatientJoinedConsultation() {
    _socket?.off('patient_joined_consultation');
  }

  void offReceiveMessage() {
    _socket?.off('receive_message');
  }

  void offReceiveNote() {
    _socket?.off('receive_note');
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}